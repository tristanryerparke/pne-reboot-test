import inspect
from fastapi import FastAPI


def create_wrapper(original_func, req_model):
    """
    Create a wrapper function that extracts parameters from request model and calls the original function.
    We need this function to avoid using query parameters for the node routes,
    and instead use a json request body for every individual node route.
    """

    def wrapper(request):
        sig = inspect.signature(original_func)
        kwargs = {}
        for param_name in sig.parameters:
            kwargs[param_name] = getattr(request, param_name)
        return original_func(**kwargs)

    wrapper.__annotations__ = {"request": req_model}
    return wrapper


def setup_function_routes(app: FastAPI, functions: dict, types: dict):
    """Programmatically create a route for each function."""
    for function_name, function_info in functions.items():
        category_path = (
            "/node/" + "/".join(function_info["category"]) + "/" + function_name
        )

        return_type = types[function_info["return"]["type"]]["class"]
        request_model = function_info["request_model"]

        # Create wrapper function that accepts a request body dict and calls the original function
        wrapper = create_wrapper(function_info["callable"], request_model)

        # Add the route to the app as POST endpoint
        app.add_api_route(
            category_path,
            wrapper,
            methods=["POST"],
            response_model=return_type,
        )
