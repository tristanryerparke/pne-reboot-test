import os
from fastapi import FastAPI
import sys
import inspect
from contextlib import asynccontextmanager
from app.analyze_file import get_all_functions_and_types
from devtools import debug as d

functions = {}
types = {}


def create_wrapper(original_func, req_model):
    """Create a wrapper function that extracts parameters from request model and calls the original function."""
    def wrapper(request):
        sig = inspect.signature(original_func)
        kwargs = {}
        for param_name in sig.parameters:
            kwargs[param_name] = getattr(request, param_name)
        return original_func(**kwargs)

    wrapper.__annotations__ = {"request": req_model}
    return wrapper


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to print sys.argv arguments."""
    global functions, types
    args = sys.argv[1:]
    if len(args) == 0:
        print("No arguments provided")
        sys.exit(1)
    search_path: str = args[0]
    if not os.path.exists(search_path):
        print(f"The path {search_path} does not exist")
        sys.exit(1)
    all_functions, all_types = get_all_functions_and_types(search_path)
    functions.update(all_functions)
    types.update(all_types)
    print(f"Found {len(functions)} functions and {len(types)} types")

    # programmatically create a route for each function
    for function_name, function_info in functions.items():
        category_path = "/".join(function_info["category"]) + "/" + function_name

        return_type = types[function_info["return"]["type"]]["class"]
        request_model = function_info["request_model"]
        
        # Create wrapper function
        wrapper = create_wrapper(function_info["callable"], request_model)

        # Add the route to the app as POST endpoint
        app.add_api_route(
            f"/{function_name}",
            wrapper,
            methods=["POST"],
            response_model=return_type,
        )

    yield


# Create the FastAPI app
app = FastAPI(
    title="Simple Test API",
    description="A simple FastAPI application with basic test endpoints",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/functions")
async def get_functions():
    functions_stripped = {}
    for k, v in functions.items():
        if isinstance(v, dict) and "callable" in v:
            v_copy = {key: value for key, value in v.items() if key not in ["callable", "request_model"]}
        else:
            v_copy = v
        functions_stripped[k] = v_copy
    return functions_stripped


@app.get("/types")
async def get_types():
    d(types)
    types_stripped = {}
    for k, v in types.items():
        if isinstance(v, dict) and "class" in v:
            v_copy = {key: value for key, value in v.items() if key != "class"}
        else:
            v_copy = v
        types_stripped[k] = v_copy
    return types_stripped