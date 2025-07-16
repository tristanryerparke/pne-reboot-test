#!/usr/bin/env python3

import sys
import argparse
import uvicorn
from .main import create_app
from .core.config import settings


def main():
    """CLI entry point for the FastAPI app"""
    parser = argparse.ArgumentParser(
        description="FastAPI app that creates routes from Python functions"
    )
    parser.add_argument(
        "target_path",
        nargs="?",
        help="Path to Python file or directory to analyze for functions"
    )
    parser.add_argument(
        "--host",
        default=settings.host,
        help=f"Host to bind to (default: {settings.host})"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=settings.port,
        help=f"Port to bind to (default: {settings.port})"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development"
    )
    
    args = parser.parse_args()
    
    # Create app with the specified target path
    app = create_app(args.target_path)
    
    print(f"Starting FastAPI server on {args.host}:{args.port}")
    if args.target_path:
        print(f"Analyzing functions from: {args.target_path}")
    
    # Run the server
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()