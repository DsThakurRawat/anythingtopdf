import sys
import img2pdf

def image_to_pdf(input_path, output_path):
    try:
        with open(output_path, "wb") as f:
            f.write(img2pdf.convert(input_path))
    except Exception as e:
        print(f"Error converting image to PDF: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python img_to_pdf.py <input> <output>", file=sys.stderr)
        sys.exit(1)
        
    image_to_pdf(sys.argv[1], sys.argv[2])
