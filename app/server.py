import os
import sys
from contextlib import asynccontextmanager

from devtools import debug as d
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.analysis.utils import analyze_file_structure
from app.graph import router as graph_router
from app.large_data.router import router as large_data_router

FUNCTION_SCHEMAS = []
CALLABLES = {}
TYPES = {}
VERBOSE = False
IGNORE_UNDERSCORE_PREFIX = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load functions and types from the provided path arguments"""
    global FUNCTION_SCHEMAS, CALLABLES, TYPES
    args = sys.argv[1:]
    if len(args) == 0:
        print("No arguments provided")
        sys.exit(1)
    search_paths_input: str = args[0]
    search_paths = [p.strip() for p in search_paths_input.split(",")]

    for search_path in search_paths:
        if not os.path.exists(search_path):
            print(f"The path {search_path} does not exist")
            sys.exit(1)

    function_schemas, callables, types = analyze_file_structure(
        search_paths, ignore_underscore_prefix=IGNORE_UNDERSCORE_PREFIX
    )
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
app.include_router(large_data_router, prefix="/data", tags=["data"])


@app.get("/nodes")
async def get_functions():
    """get schema for all loaded functions that are to be served as nodes"""
    # Manually serialize with exclude_none to remove auto_generated when False
    return [
        schema.model_dump(mode="json", exclude_defaults=True)
        for schema in FUNCTION_SCHEMAS
    ]


@app.get("/types")
async def get_types():
    """get schema for all loaded types that are to be served as node inputs / outputs"""
    # d(types)
    types_stripped = {}
    for k, v in TYPES.items():
        if isinstance(v, dict):
            # Remove non-serializable fields (_class and referenced_datamodel)
            v_copy = {
                key: value
                for key, value in v.items()
                if key not in ("_class", "referenced_datamodel")
            }
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
