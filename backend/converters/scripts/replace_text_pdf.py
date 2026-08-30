import sys
import os
import json
import re
import pymupdf

def int_to_rgb(color_int):
    """Convert integer color from PyMuPDF dict to (r, g, b) float tuple."""
    if not isinstance(color_int, int):
        return (0.0, 0.0, 0.0)
    r = ((color_int >> 16) & 255) / 255.0
    g = ((color_int >> 8) & 255) / 255.0
    b = (color_int & 255) / 255.0
    return (r, g, b)

def map_font(font_name, flags=0):
    """Map arbitrary font names to standard Base-14 PDF fonts recognized by PyMuPDF."""
    fn = (font_name or "").lower()
    is_bold = "bold" in fn or "black" in fn or "heavy" in fn or bool(flags & 2) or bool(flags & 16)
    is_italic = "italic" in fn or "oblique" in fn or bool(flags & 1)

    if any(k in fn for k in ["courier", "mono", "code"]):
        base = "cour"
    elif any(k in fn for k in ["times", "serif", "roman", "georgia"]):
        base = "times"
    else:
        base = "helv"

    if base == "times":
        if is_bold and is_italic:
            return "tibi"
        elif is_bold:
            return "tibo"
        elif is_italic:
            return "tiit"
        return "tiro"
    elif base == "cour":
        if is_bold and is_italic:
            return "cobi"
        elif is_bold:
            return "cobo"
        elif is_italic:
            return "coit"
        return "cour"
    else:
        if is_bold and is_italic:
            return "hebi"
        elif is_bold:
            return "hebo"
        elif is_italic:
            return "heit"
        return "helv"

def preserve_case_replace(match, replacement):
    """Match the casing of the original word when replacing."""
    original = match.group(0)
    if original.isupper() and len(original) > 1:
        return replacement.upper()
    elif original.istitle():
        return replacement.capitalize()
    elif original.islower():
        return replacement.lower()
    return replacement

def replace_in_string(text, find_str, replace_str, match_case):
    """Perform case-aware or exact search and replace in string."""
    if not find_str:
        return text, 0

    if match_case:
        count = text.count(find_str)
        new_text = text.replace(find_str, replace_str)
        return new_text, count
    else:
        pattern = re.compile(re.escape(find_str), re.IGNORECASE)
        matches = list(pattern.finditer(text))
        count = len(matches)
        if count == 0:
            return text, 0
        new_text = pattern.sub(lambda m: preserve_case_replace(m, replace_str), text)
        return new_text, count

def fail(message, code=1):
    """Emit a machine-readable error on stderr and exit. Never leak a traceback."""
    print(json.dumps({"status": "error", "error": message}), file=sys.stderr)
    sys.exit(code)

def normalize_rules(raw):
    """Validate and normalize the incoming rules payload into a clean list."""
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list):
        fail("Replacement rules must be a JSON array of {find, replace} objects.")

    normalized = []
    for entry in raw:
        if not isinstance(entry, dict):
            fail("Each replacement rule must be a JSON object with a 'find' field.")
        find_str = entry.get("find", "")
        if not isinstance(find_str, str):
            fail("Rule field 'find' must be a string.")
        if not find_str:
            continue
        replace_str = entry.get("replace", "")
        if replace_str is None:
            replace_str = ""
        if not isinstance(replace_str, str):
            fail("Rule field 'replace' must be a string.")
        normalized.append({
            "find": find_str,
            "replace": replace_str,
            "match_case": bool(entry.get("match_case", False)),
        })

    if not normalized:
        fail("No usable replacement rules provided (every 'find' field was empty).")
    return normalized

def replace_text_in_pdf(input_path, output_path, rules):
    """
    Perform line/sentence reflowing search and replace across all pages of a PDF.
    This guarantees that subsequent words are pushed/pulled with proper word spacing.
    """
    if not os.path.isfile(input_path):
        fail("Input PDF could not be found on the server.")

    try:
        doc = pymupdf.open(input_path)
    except Exception:
        fail("This file could not be opened as a PDF. It may be corrupted or not a real PDF.")

    if doc.needs_pass:
        doc.close()
        fail("This PDF is password-protected. Remove the password and try again.")

    if doc.page_count == 0:
        doc.close()
        fail("This PDF contains no pages.")

    total_replacements = 0
    pages_modified = set()

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_rect = page.rect
        page_dict = page.get_text("dict")
        page_changed = False

        # Store list of line replacement operations for this page
        line_operations = []

        blocks = page_dict.get("blocks", [])
        for block in blocks:
            if block.get("type") != 0:  # Text block only
                continue

            for line in block.get("lines", []):
                spans = line.get("spans", [])
                if not spans:
                    continue

                # Reconstruct full line text
                line_text = "".join([s.get("text", "") for s in spans])
                if not line_text.strip():
                    continue

                # Check if any rule matches this line
                modified_line_text = line_text
                line_match_count = 0

                for rule in rules:
                    find_str = rule.get("find", "")
                    if not find_str:
                        continue
                    replace_str = rule.get("replace", "")
                    match_case = rule.get("match_case", True)

                    modified_line_text, count = replace_in_string(
                        modified_line_text, find_str, replace_str, match_case
                    )
                    line_match_count += count

                if line_match_count > 0:
                    total_replacements += line_match_count
                    page_changed = True

                    # Extract primary styling from first non-empty span
                    primary_span = spans[0]
                    for s in spans:
                        if s.get("text", "").strip():
                            primary_span = s
                            break

                    font_name = map_font(primary_span.get("font", ""), primary_span.get("flags", 0))
                    font_size = primary_span.get("size", 11.0)
                    color = int_to_rgb(primary_span.get("color", 0))

                    origin_coords = primary_span.get("origin")
                    if origin_coords:
                        origin = pymupdf.Point(origin_coords[0], origin_coords[1])
                    else:
                        bbox = line["bbox"]
                        origin = pymupdf.Point(bbox[0], bbox[3] - (bbox[3] - bbox[1]) * 0.18)

                    # Bounding box for line with safety padding for clean redaction
                    bbox = line["bbox"]
                    line_rect = pymupdf.Rect(
                        bbox[0] - 1.0,
                        bbox[1] - 1.0,
                        bbox[2] + 1.0,
                        bbox[3] + 1.0
                    )

                    line_operations.append({
                        "rect": line_rect,
                        "origin": origin,
                        "new_text": modified_line_text,
                        "font": font_name,
                        "size": font_size,
                        "color": color
                    })

        if page_changed:
            pages_modified.add(page_num + 1)

            # Step 1: Add redaction annotations for all modified lines
            for op in line_operations:
                page.add_redact_annot(op["rect"], fill=(1, 1, 1))

            # Step 2: Commit all redactions (cleanly wipes out the lines)
            page.apply_redactions()

            # Step 3: Re-insert lines with reflowed word spacing
            for op in line_operations:
                new_text = op["new_text"]
                if not new_text.strip():
                    continue

                font_name = op["font"]
                font_size = op["size"]
                color = op["color"]
                origin = op["origin"]

                # Check if new line text length exceeds available width to margin
                available_width = max(50.0, page_rect.width - 20.0 - origin.x)
                try:
                    text_len = pymupdf.get_text_length(new_text, fontname=font_name, fontsize=font_size)
                except Exception:
                    text_len = len(new_text) * (font_size * 0.55)

                adjusted_size = font_size
                if text_len > available_width:
                    scale = max(0.65, available_width / text_len)
                    adjusted_size = font_size * scale

                # Insert the reflowed sentence
                try:
                    page.insert_text(
                        origin,
                        new_text,
                        fontname=font_name,
                        fontsize=adjusted_size,
                        color=color
                    )
                except Exception:
                    try:
                        page.insert_text(
                            origin,
                            new_text,
                            fontname="helv",
                            fontsize=adjusted_size,
                            color=color
                        )
                    except Exception:
                        pass

    # Save output PDF
    try:
        doc.save(output_path, garbage=3, deflate=True)
        doc.close()
    except Exception as e:
        print(json.dumps({"error": f"Failed to save modified PDF: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    result = {
        "status": "success" if total_replacements > 0 else "no_matches",
        "total_replacements": total_replacements,
        "pages_modified": sorted(list(pages_modified))
    }
    print(json.dumps(result))

def load_rules(rules_arg):
    """Rules arrive either as a path to a JSON file or as a raw JSON string."""
    if os.path.isfile(rules_arg):
        try:
            with open(rules_arg, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            fail("Replacement rules file could not be read as valid JSON.")
    try:
        return json.loads(rules_arg)
    except Exception:
        fail("Replacement rules were not valid JSON.")


def main():
    if len(sys.argv) < 4:
        fail("Usage: replace_text_pdf.py <input.pdf> <output.pdf> <rules_json_or_file>", code=2)

    input_pdf, output_pdf, rules_arg = sys.argv[1], sys.argv[2], sys.argv[3]
    rules = normalize_rules(load_rules(rules_arg))
    replace_text_in_pdf(input_pdf, output_pdf, rules)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        # Last line of defence: a traceback on stdout would corrupt the Go side's
        # JSON parsing and leak server internals to the client.
        fail(f"Unexpected error while editing the PDF: {type(exc).__name__}")
