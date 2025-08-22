#!/bin/bash

echo "Installing TeachMe.ai Backend Dependencies..."
echo

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed or not in PATH"
    echo "Please install Bun from https://bun.sh/"
    exit 1
fi

echo "Bun is installed. Installing dependencies..."
bun install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo
echo "Dependencies installed successfully!"
echo
echo "Starting the backend server..."
echo "Server will be available at: http://localhost:3001"
echo
echo "Press Ctrl+C to stop the server"
echo

bun run dev
