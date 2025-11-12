import os
import sys
from contextlib import asynccontextmanager

from devtools import debug as d
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.analysis.utils import analyze_file_structure
from app.graph import router as graph_router

FUNCTION_SCHEMAS = []
CALLABLES = {}
TYPES = {}
VERBOSE = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load functions and types from the provided path argument"""
    global FUNCTION_SCHEMAS, CALLABLES, TYPES
    args = sys.argv[1:]
    if len(args) == 0:
        print("No arguments provided")
        sys.exit(1)
    search_path: str = args[0]
    if not os.path.exists(search_path):
        print(f"The path {search_path} does not exist")
        sys.exit(1)

    function_schemas, callables, types = analyze_file_structure(search_path)
    FUNCTION_SCHEMAS.extend(function_schemas)
    CALLABLES.update(callables)
    TYPES.update(types)

    if VERBOSE:
        print(f"Found {len(FUNCTION_SCHEMAS)} functions and {len(TYPES)} types")
        d(FUNCTION_SCHEMAS)
        d(TYPES)

    yield


# Create the FastAPI app
app = FastAPI(
    title="Python Node Editor",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(graph_router)


@app.get("/nodes")
async def get_functions():
    """get schema for all loaded functions that are to be served as nodes"""
    # FastAPI will automatically serialize the dict of FunctionSchema models
    return FUNCTION_SCHEMAS


@app.get("/types")
async def get_types():
    """get schema for all loaded types that are to be served as node inputs / outputs"""
    # d(types)
    types_stripped = {}
    for k, v in TYPES.items():
        if isinstance(v, dict) and "_class" in v:
            v_copy = {key: value for key, value in v.items() if key != "_class"}
        else:
            v_copy = v
        types_stripped[k] = v_copy
    return types_stripped


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)
