import sys
import aspose.slides as slides

def office_to_pdf(input_path, output_path):
    try:
        # Instantiate a Presentation object that represents a presentation file
        presetation = slides.Presentation(input_path)
        
        # Save the presentation to PDF with default options
        presetation.save(output_path, slides.export.SaveFormat.PDF)
    except Exception as e:
        print(f"Error converting office doc to PDF: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python pptx_to_pdf.py <input> <output>", file=sys.stderr)
        sys.exit(1)
        
    office_to_pdf(sys.argv[1], sys.argv[2])
