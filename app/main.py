import os
import sys
from pathlib import Path
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Add the workspace root to the path so we can import analyze_file
sys.path.insert(0, str(Path(__file__).parent.parent))
from analyze_file import analyze_module


class FunctionCallRequest(BaseModel):
    arguments: Dict[str, Any]


class FunctionCallResponse(BaseModel):
    result: Any


def create_app(target_path: str = None) -> FastAPI:
    """Create FastAPI app with dynamically generated routes based on Python files."""
    app = FastAPI(
        title="Dynamic Function API",
        description="Automatically generated API based on Python functions",
        version="1.0.0"
    )
    
    if target_path is None:
        # Default to analyzing the workspace root
        target_path = str(Path(__file__).parent.parent)
    
    # Store function info for route generation
    all_functions_info = {}
    all_types_dict = {}
    
    # Get all Python files to analyze
    py_files = []
    if os.path.isdir(target_path):
        for root, dirs, files in os.walk(target_path):
            # Skip the app directory to avoid circular imports
            if 'app' in Path(root).parts:
                continue
            for file in files:
                if file.endswith(".py") and not file.startswith("__"):
                    py_files.append(os.path.join(root, file))
    else:
        py_files = [target_path]
    
    # Analyze each file and create routes
    for py_file in py_files:
        try:
            # Calculate relative path and module name
            base_dir = os.path.dirname(os.path.abspath(target_path))
            if base_dir not in sys.path:
                sys.path.insert(0, base_dir)
            
            rel_path = os.path.relpath(py_file, base_dir)
            module_name = str(rel_path.replace(".py", "").replace(os.sep, "."))
            
            # Skip main files to avoid conflicts
            if module_name.endswith('.main') or module_name == 'main':
                continue
                
            functions_info, types_dict = analyze_module(module_name)
            
            # Store the function info
            all_functions_info[module_name] = functions_info
            all_types_dict.update(types_dict)
            
            # Create routes for each function
            for func_name, func_info in functions_info.items():
                create_function_route(app, module_name, func_name, func_info)
                
        except Exception as e:
            print(f"Error analyzing {py_file}: {e}")
            continue
    
    @app.get("/")
    async def root():
        return {
            "message": "Dynamic Function API",
            "available_routes": [
                f"/{module_name.replace('.', '/')}/{func_name}" 
                for module_name, functions in all_functions_info.items() 
                for func_name in functions.keys()
            ]
        }
    
    @app.get("/functions")
    async def list_functions():
        return {
            "functions": all_functions_info,
            "types": all_types_dict
        }
    
    return app


def create_function_route(app: FastAPI, module_name: str, func_name: str, func_info: Dict[str, Any]):
    """Create a route for a specific function."""
    route_path = f"/{module_name.replace('.', '/')}/{func_name}"
    
    async def function_endpoint(request: FunctionCallRequest):
        try:
            # Get the actual function
            func = func_info["callable"]
            
            # Extract arguments from request
            args = request.arguments
            
            # Validate that all required arguments are provided
            required_args = set()
            for arg_name, arg_info in func_info["arguments"].items():
                if "default_value" not in arg_info:
                    required_args.add(arg_name)
            
            provided_args = set(args.keys())
            missing_args = required_args - provided_args
            
            if missing_args:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required arguments: {list(missing_args)}"
                )
            
            # Call the function with the provided arguments
            result = func(**args)
            
            return FunctionCallResponse(result=result)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    # Add the route to the app
    app.post(route_path, response_model=FunctionCallResponse)(function_endpoint)


# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)