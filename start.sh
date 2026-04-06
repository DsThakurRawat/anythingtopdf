#!/bin/bash

# Kill any existing processes on these ports just in case
fuser -k 8000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

echo "Starting Go Backend (Port 8000)..."
cd backend
go run main.go &
BACKEND_PID=$!

echo "Starting Next.js Frontend (Port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "==========================================="
echo " Anything to PDF is now running!"
echo " Backend API: http://localhost:8000"
echo " Frontend UI: http://localhost:3000"
echo " Press Ctrl+C to stop both servers."
echo "==========================================="

# Wait for process exit and clean up child processes on Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
