FROM golang:latest

# Install Python, pip, and required system libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Python Virtual Environment to keep dependencies isolated
RUN python3 -m venv /opt/venv
# Enable venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python sidecar dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the backend source code
COPY . .

# Build the Go application
RUN go build -o main .

# Expose the API port
EXPOSE 8000

# Start the application
CMD ["./main"]
