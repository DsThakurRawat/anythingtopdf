# Anything To PDF Converter

A high-performance, stable, and production-ready document conversion platform that converts various media formats (Images, PPTX, and ZIP archives) into PDF documents.

## Features

- **Universal Media Support**: Convert images (PNG, JPG, etc.), PowerPoint presentations (PPTX), and bulk ZIP archives into PDFs.
- **WhatsApp Image Sequencing**: Specialized extraction and precise custom sequencing of images downloaded from WhatsApp into a cohesive PDF.
- **Go Backend**: A robust, concurrent backend developed in Go for high-speed file handling and processing execution.
- **Python Sidecars**: Dedicated Python scripts to handle complex document rendering, layout logic, and format transformations.
- **Next.js Frontend**: A modern, minimalist user interface using Next.js and Tailwind CSS for seamless user interaction.
- **Fault-Tolerant File Management**: Handles uploads, custom sequencing, renaming, and conversion gracefully.

## Architecture

- **`backend/`**: Contains the Go core logic and handlers for API requests and concurrency control.
- **`frontend/`**: Contains the Next.js React codebase for the user interface.
- **Python Scripts**: Specialized converting scripts (e.g., `img_to_pdf.py`, `merge_pdfs.py`, `rename_script.py`) inside `backend/converters/scripts`.

## Setup & Running

1. **Backend**:
   Navigate to the `backend/` directory, ensure Go is installed, and run:
   ```bash
   go mod download
   go run main.go
   ```
   Or use the `start.sh` script to launch the environment.

2. **Python Dependencies**:
   Create a virtual environment (`venv`) and install dependencies (like `Pillow`, `python-pptx`, `PyPDF2`, etc.) used by the sidecar scripts.

3. **Frontend**:
   Navigate to `frontend/` and run:
   ```bash
   npm install
   npm run dev
   ```

## Development & Contribution

Pull requests are actively welcomed to enhance converters, refine the UI, or improve throughput.

All images, ZIP test files, and resulting PDFs are configured to be ignored by version control to keep the repository lightweight and secure.
