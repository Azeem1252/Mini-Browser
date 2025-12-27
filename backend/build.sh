#!/bin/bash
# Compilation script for Linux/Mac

g++ -std=c++17 -Wall -Wextra main.cpp -o browser_engine -I.

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "To run the server:"
    echo "  ./browser_engine"
else
    echo "❌ Build failed!"
fi
