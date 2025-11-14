def main():
    import argparse
    import sys

    import uvicorn

    parser = argparse.ArgumentParser(description="Run the Python Node Editor backend")
    parser.add_argument(
        "path", help="Comma-separated paths to analyze for functions and types"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )
    # Common uvicorn options
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    args = parser.parse_args()

    # Store verbose flag globally for server and graph to access
    import app.graph
    import app.server

    app.server.VERBOSE = args.verbose
    app.graph.VERBOSE = args.verbose

    # Reconstruct sys.argv for the lifespan handler to read the paths
    sys.argv = [sys.argv[0], args.path]

    from app.server import app as fastapi_app

    uvicorn.run(fastapi_app, host=args.host, port=args.port, reload=args.reload)


def analyze():
    import argparse
    import os

    from devtools import debug as d

    from app.analysis.utils import analyze_file_structure

    parser = argparse.ArgumentParser(
        description="Analyze Python files for functions and types"
    )
    parser.add_argument(
        "path", help="Comma-separated paths to analyze for functions and types"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )

    args = parser.parse_args()

    search_paths = [p.strip() for p in args.path.split(",")]

    for search_path in search_paths:
        if not os.path.exists(search_path):
            print(f"The path {search_path} does not exist")
            exit(1)

    print(f"Analyzing: {', '.join(search_paths)}")
    function_schemas, callables, types = analyze_file_structure(search_paths)

    print(f"\nFound {len(function_schemas)} functions and {len(types)} types")

    if args.verbose:
        print("\nFUNCTION_SCHEMAS:")
        d(function_schemas)
        print("\nTYPES:")
        d(types)
