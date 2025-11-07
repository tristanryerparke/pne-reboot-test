import os
import sys
from contextlib import asynccontextmanager

from devtools import debug as d
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.analysis.utils import get_all_functions_and_types
from app.graph import router as graph_router
from app.schema import FunctionAsNode

FUNCTIONS: dict[str, FunctionAsNode] = {}
TYPES = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load functions and types from the provided path argument"""
    global FUNCTIONS, TYPES
    args = sys.argv[1:]
    if len(args) == 0:
        print("No arguments provided")
        sys.exit(1)
    search_path: str = args[0]
    if not os.path.exists(search_path):
        print(f"The path {search_path} does not exist")
        sys.exit(1)
    all_functions, all_types = get_all_functions_and_types(search_path)
    FUNCTIONS.update(all_functions)
    TYPES.update(all_types)
    print(f"Found {len(FUNCTIONS)} functions and {len(TYPES)} types")
    d(TYPES)
    d(FUNCTIONS)

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
    # Remove the un-serializable types (callable) from the functions that are to become nodes
    # Serialize and send them to the frontend
    functions_stripped = {}

    for k, v in FUNCTIONS.items():
        # FunctionAsNode.model_dump() will automatically exclude fields marked with exclude=True
        if hasattr(v, "model_dump"):
            v_copy = v.model_dump()
        else:
            v_copy = v
        functions_stripped[k] = v_copy
    return functions_stripped


@app.get("/types")
async def get_types():
    """get schema for all loaded types that are to be served as node inputs / outputs"""
    # d(types)
    types_stripped = {}
    for k, v in TYPES.items():
        if isinstance(v, dict) and "class" in v:
            v_copy = {key: value for key, value in v.items() if key != "class"}
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
