import pytest
import requests
import subprocess
import time
import threading
import sys
import os
from typing import Dict, Any

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import create_app
import uvicorn


class FastAPITestServer:
    """Context manager to run FastAPI server for testing"""
    
    def __init__(self, app, host="127.0.0.1", port=8001):
        self.app = app
        self.host = host
        self.port = port
        self.server_thread = None
        self.base_url = f"http://{host}:{port}"
        
    def __enter__(self):
        """Start the server in a separate thread"""
        def run_server():
            uvicorn.run(self.app, host=self.host, port=self.port, log_level="error")
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        
        # Wait for server to start
        max_attempts = 10
        for _ in range(max_attempts):
            try:
                response = requests.get(f"{self.base_url}/health", timeout=1)
                if response.status_code == 200:
                    break
            except requests.exceptions.RequestException:
                pass
            time.sleep(0.5)
        else:
            raise RuntimeError("Failed to start test server")
            
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Server will stop when main thread exits"""
        pass


@pytest.fixture
def test_server():
    """Fixture that provides a running FastAPI test server"""
    # Create app with test_file.py in the app directory
    app_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app")
    test_file_path = os.path.join(app_dir, "test_file.py")
    
    app = create_app(test_file_path)
    
    with FastAPITestServer(app) as server:
        yield server


class TestFastAPIApp:
    """Test cases for the FastAPI application"""
    
    def test_health_endpoint(self, test_server):
        """Test the health check endpoint"""
        response = requests.get(f"{test_server.base_url}/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
    
    def test_root_endpoint(self, test_server):
        """Test the root endpoint shows discovered functions"""
        response = requests.get(f"{test_server.base_url}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "functions_discovered" in data
        assert "available_endpoints" in data
        assert data["functions_discovered"] >= 1  # Should find at least the proportion function
    
    def test_list_functions_endpoint(self, test_server):
        """Test the /info/functions endpoint"""
        response = requests.get(f"{test_server.base_url}/info/functions")
        assert response.status_code == 200
        functions = response.json()
        assert isinstance(functions, dict)
        # Should contain the proportion function
        assert any("proportion" in key for key in functions.keys())
    
    def test_list_types_endpoint(self, test_server):
        """Test the /info/types endpoint"""
        response = requests.get(f"{test_server.base_url}/info/types")
        assert response.status_code == 200
        types_data = response.json()
        assert isinstance(types_data, dict)
    
    def test_proportion_function_endpoint(self, test_server):
        """Test calling the proportion function via the API"""
        # First, get the available functions to find the exact route
        response = requests.get(f"{test_server.base_url}/info/functions")
        functions = response.json()
        
        # Find the proportion function
        proportion_key = None
        for key in functions.keys():
            if "proportion" in key:
                proportion_key = key
                break
        
        assert proportion_key is not None, "Proportion function not found"
        
        # Extract module and function name for the route
        module_name, func_name = proportion_key.rsplit(".", 1)
        route_path = f"/{module_name}/{func_name}"
        
        # Test valid function call
        test_data = {
            "arguments": {
                "x": 10,
                "propor": 0.5
            }
        }
        
        response = requests.post(
            f"{test_server.base_url}{route_path}",
            json=test_data
        )
        assert response.status_code == 200
        result = response.json()
        assert "result" in result
        assert result["result"] == 5.0  # 10 * 0.5 = 5.0
    
    def test_proportion_function_missing_args(self, test_server):
        """Test calling proportion function with missing arguments"""
        # Get the route path
        response = requests.get(f"{test_server.base_url}/info/functions")
        functions = response.json()
        proportion_key = next(key for key in functions.keys() if "proportion" in key)
        module_name, func_name = proportion_key.rsplit(".", 1)
        route_path = f"/{module_name}/{func_name}"
        
        # Test with missing argument
        test_data = {
            "arguments": {
                "x": 10
                # Missing "propor" argument
            }
        }
        
        response = requests.post(
            f"{test_server.base_url}{route_path}",
            json=test_data
        )
        assert response.status_code == 400
        error = response.json()
        assert "Missing required arguments" in error["detail"]
    
    def test_proportion_function_extra_args(self, test_server):
        """Test calling proportion function with extra arguments"""
        # Get the route path
        response = requests.get(f"{test_server.base_url}/info/functions")
        functions = response.json()
        proportion_key = next(key for key in functions.keys() if "proportion" in key)
        module_name, func_name = proportion_key.rsplit(".", 1)
        route_path = f"/{module_name}/{func_name}"
        
        # Test with extra argument
        test_data = {
            "arguments": {
                "x": 10,
                "propor": 0.5,
                "extra_arg": "unexpected"
            }
        }
        
        response = requests.post(
            f"{test_server.base_url}{route_path}",
            json=test_data
        )
        assert response.status_code == 400
        error = response.json()
        assert "Unexpected arguments" in error["detail"]
    
    def test_nonexistent_function(self, test_server):
        """Test calling a non-existent function"""
        response = requests.post(
            f"{test_server.base_url}/nonexistent/function",
            json={"arguments": {}}
        )
        assert response.status_code == 404
    
    def test_function_info_endpoint(self, test_server):
        """Test getting detailed info about a specific function"""
        # Get the available functions first
        response = requests.get(f"{test_server.base_url}/info/functions")
        functions = response.json()
        proportion_key = next(key for key in functions.keys() if "proportion" in key)
        module_name, func_name = proportion_key.rsplit(".", 1)
        
        # Get function info
        response = requests.get(
            f"{test_server.base_url}/info/function/{module_name}/{func_name}"
        )
        assert response.status_code == 200
        func_info = response.json()
        assert "arguments" in func_info
        assert "return" in func_info
        assert len(func_info["arguments"]) == 2  # x and propor
    
    def test_function_info_nonexistent(self, test_server):
        """Test getting info for non-existent function"""
        response = requests.get(
            f"{test_server.base_url}/info/function/nonexistent/function"
        )
        assert response.status_code == 404


class TestMultipleFunctions:
    """Test with multiple functions"""
    
    @pytest.fixture
    def multi_function_server(self):
        """Server with multiple test functions"""
        # Create a temporary test file with multiple functions
        import tempfile
        import os
        
        test_code = '''
def add_numbers(a: int, b: int) -> int:
    """Add two numbers together"""
    return a + b

def multiply(x: float, y: float) -> float:
    """Multiply two numbers"""
    return x * y

def greet(name: str, greeting: str = "Hello") -> str:
    """Greet someone with an optional greeting"""
    return f"{greeting}, {name}!"
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(test_code)
            temp_file = f.name
        
        try:
            app = create_app(temp_file)
            with FastAPITestServer(app) as server:
                yield server
        finally:
            os.unlink(temp_file)
    
    def test_multiple_functions_discovered(self, multi_function_server):
        """Test that multiple functions are discovered"""
        response = requests.get(f"{multi_function_server.base_url}/info/functions")
        functions = response.json()
        
        # Should find at least 3 functions
        assert len(functions) >= 3
        
        function_names = [key.split(".")[-1] for key in functions.keys()]
        assert "add_numbers" in function_names
        assert "multiply" in function_names
        assert "greet" in function_names
    
    def test_function_with_default_args(self, multi_function_server):
        """Test calling function with default arguments"""
        response = requests.get(f"{multi_function_server.base_url}/info/functions")
        functions = response.json()
        
        greet_key = next(key for key in functions.keys() if "greet" in key)
        module_name, func_name = greet_key.rsplit(".", 1)
        route_path = f"/{module_name}/{func_name}"
        
        # Test with only required argument
        test_data = {
            "arguments": {
                "name": "World"
            }
        }
        
        response = requests.post(
            f"{multi_function_server.base_url}{route_path}",
            json=test_data
        )
        assert response.status_code == 200
        result = response.json()
        assert result["result"] == "Hello, World!"
        
        # Test with both arguments
        test_data = {
            "arguments": {
                "name": "World",
                "greeting": "Hi"
            }
        }
        
        response = requests.post(
            f"{multi_function_server.base_url}{route_path}",
            json=test_data
        )
        assert response.status_code == 200
        result = response.json()
        assert result["result"] == "Hi, World!"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])