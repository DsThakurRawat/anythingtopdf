import sys
import pypdf

def merge_pdfs(output_path, pdf_files):
    try:
        merger = pypdf.PdfWriter()
        for pdf in pdf_files:
            merger.append(pdf)
        
        merger.write(output_path)
        merger.close()
    except Exception as e:
        print(f"Error merging PDFs: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python merge_pdfs.py <output> <input1> <input2> ...", file=sys.stderr)
        sys.exit(1)
        
    output_path = sys.argv[1]
    pdf_files = sys.argv[2:]
    merge_pdfs(output_path, pdf_files)
