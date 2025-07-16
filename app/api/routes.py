from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Callable
import inspect


class FunctionRequest(BaseModel):
    arguments: Dict[str, Any]


class FunctionResponse(BaseModel):
    result: Any


def create_dynamic_router(functions_info: Dict[str, Dict[str, Any]]) -> APIRouter:
    """
    Create FastAPI router with dynamic routes based on discovered functions.
    
    Args:
        functions_info: Dictionary mapping "module.function" to function metadata
        
    Returns:
        APIRouter with dynamically created routes
    """
    router = APIRouter()
    
    for full_func_name, func_info in functions_info.items():
        # Parse module and function name
        module_name, func_name = full_func_name.rsplit(".", 1)
        
        # Create route path: /module_name/function_name
        route_path = f"/{module_name}/{func_name}"
        
        # Get the actual callable function
        func_callable: Callable = func_info["callable"]
        func_args = func_info["arguments"]
        
        def create_endpoint(func: Callable, func_arguments: Dict[str, Any], function_name: str):
            """Create endpoint function for the given function"""
            async def endpoint(request: FunctionRequest) -> FunctionResponse:
                try:
                    # Validate that all required arguments are provided
                    provided_args = set(request.arguments.keys())
                    required_args = set()
                    optional_args = set()
                    
                    for arg_name, arg_info in func_arguments.items():
                        if "default_value" in arg_info:
                            optional_args.add(arg_name)
                        else:
                            required_args.add(arg_name)
                    
                    # Check for missing required arguments
                    missing_args = required_args - provided_args
                    if missing_args:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Missing required arguments: {missing_args}"
                        )
                    
                    # Check for unexpected arguments
                    all_valid_args = required_args | optional_args
                    unexpected_args = provided_args - all_valid_args
                    if unexpected_args:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Unexpected arguments: {unexpected_args}"
                        )
                    
                    # Call the function with provided arguments
                    result = func(**request.arguments)
                    return FunctionResponse(result=result)
                    
                except TypeError as e:
                    raise HTTPException(status_code=400, detail=f"Function call error: {str(e)}")
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Function execution error: {str(e)}")
            
            return endpoint
        
        # Create the endpoint
        endpoint_func = create_endpoint(func_callable, func_args, func_name)
        
        # Add route to router
        router.add_api_route(
            route_path,
            endpoint_func,
            methods=["POST"],
            response_model=FunctionResponse,
            summary=f"Execute {func_name}",
            description=func_info.get("doc", f"Execute function {func_name} from {module_name}")
        )
    
    return router


def create_info_router(functions_info: Dict[str, Dict[str, Any]], types_dict: Dict[str, Dict[str, Any]]) -> APIRouter:
    """
    Create router with information endpoints about discovered functions and types.
    """
    router = APIRouter(prefix="/info", tags=["info"])
    
    @router.get("/functions")
    async def list_functions():
        """List all discovered functions with their metadata"""
        # Remove the callable from the response as it's not JSON serializable
        safe_functions = {}
        for name, info in functions_info.items():
            safe_info = {k: v for k, v in info.items() if k != "callable"}
            safe_functions[name] = safe_info
        return safe_functions
    
    @router.get("/types")
    async def list_types():
        """List all discovered types"""
        # Remove the class from the response as it's not JSON serializable
        safe_types = {}
        for name, info in types_dict.items():
            safe_info = {k: v for k, v in info.items() if k != "class"}
            safe_types[name] = safe_info
        return safe_types
    
    @router.get("/function/{module_name}/{function_name}")
    async def get_function_info(module_name: str, function_name: str):
        """Get detailed information about a specific function"""
        full_name = f"{module_name}.{function_name}"
        if full_name not in functions_info:
            raise HTTPException(status_code=404, detail="Function not found")
        
        info = functions_info[full_name].copy()
        info.pop("callable", None)  # Remove non-serializable callable
        return info
    
    return router