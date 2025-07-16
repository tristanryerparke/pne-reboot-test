from fastapi import FastAPI
import sys
import os
from .core.config import settings
from .services.function_discovery import discover_functions
from .api.routes import create_dynamic_router, create_info_router


def create_app(target_path: str = None) -> FastAPI:
    """
    Create FastAPI app with dynamic routes based on discovered functions.
    
    Args:
        target_path: Path to analyze for functions. If None, uses settings.target_path
    """
    app = FastAPI(
        title=settings.app_name,
        description="FastAPI app that automatically creates routes from Python functions",
        version="1.0.0"
    )
    
    # Determine target path
    if target_path is None:
        target_path = settings.target_path
    
    if target_path is None:
        # Default to current working directory
        target_path = os.getcwd()
    
    # Discover functions
    print(f"Analyzing functions in: {target_path}")
    functions_info, types_dict = discover_functions(target_path)
    
    print(f"Discovered {len(functions_info)} functions")
    for func_name in functions_info.keys():
        print(f"  - {func_name}")
    
    # Create and include dynamic router
    if functions_info:
        dynamic_router = create_dynamic_router(functions_info)
        app.include_router(dynamic_router, tags=["functions"])
    
    # Create and include info router
    info_router = create_info_router(functions_info, types_dict)
    app.include_router(info_router)
    
    @app.get("/")
    async def root():
        return {
            "message": "Dynamic FastAPI Function Router",
            "functions_discovered": len(functions_info),
            "available_endpoints": list(functions_info.keys())
        }
    
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
    
    return app


# Create app instance for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn
    import sys
    
    target_path = None
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    
    app = create_app(target_path)
    uvicorn.run(app, host=settings.host, port=settings.port)