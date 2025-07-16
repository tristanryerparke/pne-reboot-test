import sys
import uvicorn
from pathlib import Path
from .main import create_app


def main():
    """CLI entry point for running the FastAPI app with a specific target path."""
    if len(sys.argv) < 2:
        print("Usage: python -m app.cli <filename or directory>")
        print("   or: uvicorn app.main:app --reload")
        sys.exit(1)
    
    target_path = sys.argv[1]
    
    # Create the app with the specified target path
    app = create_app(target_path)
    
    print(f"Starting FastAPI server for target: {target_path}")
    print("Available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    print("Available routes at: http://localhost:8000/")
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
    main()