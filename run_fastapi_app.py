#!/usr/bin/env python3
"""
FastAPI app runner that mimics the behavior of main.py
Usage: python run_fastapi_app.py <file_or_directory>
"""

import sys
import os
from app.main import create_app
import uvicorn

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_fastapi_app.py <filename or directory>")
        print("Example: python run_fastapi_app.py test_file.py")
        print("Example: python run_fastapi_app.py folder_with_func/")
        sys.exit(1)
    
    target_path = sys.argv[1]
    
    # Create the FastAPI app with the target path
    app = create_app(target_path)
    
    print(f"\nStarting FastAPI server...")
    print(f"Target path: {target_path}")
    print(f"Server will be available at: http://localhost:8000")
    print(f"API documentation: http://localhost:8000/docs")
    print(f"Alternative docs: http://localhost:8000/redoc")
    print(f"Function info: http://localhost:8000/info/functions")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)