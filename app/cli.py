def main():
    import argparse
    import os
    import subprocess
    import sys

    import uvicorn

    parser = argparse.ArgumentParser(description="Run the Python Node Editor backend")
    parser.add_argument(
        "path", help="Comma-separated paths to analyze for functions and types"
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Enable verbose output"
    )
    parser.add_argument(
        "--do_not_ignore_underscore_prefix",
        action="store_true",
        help="Do not ignore files and folders starting with underscore",
    )
    parser.add_argument(
        "-f",
        "--frontend",
        action="store_true",
        help="Build and serve the frontend from the dist folder",
    )
    # Common uvicorn options
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    args = parser.parse_args()

    # Build frontend if --frontend flag is provided
    if args.frontend:
        frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")

        # Run bun i
        print("Frontend: Installing dependencies...", end="", flush=True)
        result = subprocess.run(["bun", "i"], cwd=frontend_dir, capture_output=True)
        if result.returncode != 0:
            print(f"\nError installing dependencies: {result.stderr.decode()}")
            sys.exit(1)

        # Run bun run build
        print("\rFrontend: Building...                          ", end="", flush=True)
        result = subprocess.run(
            ["bun", "run", "build"], cwd=frontend_dir, capture_output=True
        )
        if result.returncode != 0:
            print(f"\nError building frontend: {result.stderr.decode()}")
            sys.exit(1)

        print("\rFrontend: Build complete!                      ")

    # Store verbose flag globally for server and graph to access
    import app.graph
    import app.server

    app.server.VERBOSE = args.verbose
    app.graph.VERBOSE = args.verbose
    app.server.IGNORE_UNDERSCORE_PREFIX = not args.do_not_ignore_underscore_prefix
    app.server.SERVE_FRONTEND = args.frontend

    # Reconstruct sys.argv for the lifespan handler to read the paths
    sys.argv = [sys.argv[0], args.path]

    from app.server import app as fastapi_app

    # Mount frontend static files if requested (must be done after all routes are added)
    if args.frontend:
        app.server.mount_frontend()
        # ANSI escape codes for blue and clickable link
        blue = "\033[94m\033]8;;"
        reset = "\033]8;;\033\\\033[0m"
        frontend_url = f"http://{args.host}:{args.port}"
        print(f"Frontend available at: {blue}{frontend_url}\033\\{frontend_url}{reset}")

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
    parser.add_argument(
        "--do_not_ignore_underscore_prefix",
        action="store_true",
        help="Do not ignore files and folders starting with underscore",
    )

    args = parser.parse_args()

    search_paths = [p.strip() for p in args.path.split(",")]

    for search_path in search_paths:
        if not os.path.exists(search_path):
            print(f"The path {search_path} does not exist")
            exit(1)

    print(f"Analyzing: {', '.join(search_paths)}")
    ignore_underscore = not args.do_not_ignore_underscore_prefix
    function_schemas, callables, types = analyze_file_structure(
        search_paths, ignore_underscore_prefix=ignore_underscore
    )

    print(f"\nFound {len(function_schemas)} functions and {len(types)} types")

    if args.verbose:
        print("\nFUNCTION_SCHEMAS:")
        d(function_schemas)
        print("\nTYPES:")
        d(types)
