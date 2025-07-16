#!/usr/bin/env python3
"""
Demonstration script showing how to test the FastAPI endpoints using requests.
This script can be run independently and doesn't require installing the project as a library.
"""

import requests
import json
import time
import subprocess
import threading
import sys
import os
from typing import Optional


def wait_for_server(base_url: str, timeout: int = 30) -> bool:
    """Wait for the server to be ready"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{base_url}/health", timeout=1)
            if response.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(0.5)
    return False


def test_api_endpoints(base_url: str = "http://localhost:8000"):
    """Test the API endpoints"""
    print(f"Testing API at {base_url}")
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
        return False
    
    # Test root endpoint
    print("\n2. Testing root endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Functions discovered: {data.get('functions_discovered', 0)}")
        print(f"   Available endpoints: {data.get('available_endpoints', [])}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test info/functions endpoint
    print("\n3. Testing /info/functions endpoint...")
    try:
        response = requests.get(f"{base_url}/info/functions")
        print(f"   Status: {response.status_code}")
        functions = response.json()
        print(f"   Functions found: {list(functions.keys())}")
        
        # Find a function to test
        if functions:
            # Look for the proportion function or any available function
            test_function_key = None
            for key in functions.keys():
                if "proportion" in key:
                    test_function_key = key
                    break
            
            if not test_function_key:
                test_function_key = list(functions.keys())[0]
            
            print(f"   Selected function for testing: {test_function_key}")
            
            # Test calling the function
            print(f"\n4. Testing function call: {test_function_key}")
            module_name, func_name = test_function_key.rsplit(".", 1)
            route_path = f"/{module_name}/{func_name}"
            
            func_info = functions[test_function_key]
            print(f"   Function arguments: {func_info.get('arguments', {})}")
            
            # If it's the proportion function, test it
            if "proportion" in test_function_key:
                test_data = {
                    "arguments": {
                        "x": 10,
                        "propor": 0.25
                    }
                }
                
                print(f"   Calling POST {base_url}{route_path}")
                print(f"   Request data: {json.dumps(test_data, indent=2)}")
                
                try:
                    response = requests.post(f"{base_url}{route_path}", json=test_data)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 200:
                        result = response.json()
                        print(f"   Result: {result}")
                        expected = 10 * 0.25
                        print(f"   Expected: {expected}")
                        if result.get("result") == expected:
                            print("   ✅ Test passed!")
                        else:
                            print("   ❌ Test failed: unexpected result")
                    else:
                        print(f"   ❌ Error: {response.text}")
                except Exception as e:
                    print(f"   Error: {e}")
                
                # Test with missing arguments
                print(f"\n5. Testing error handling (missing arguments)...")
                invalid_data = {"arguments": {"x": 10}}  # Missing 'propor'
                try:
                    response = requests.post(f"{base_url}{route_path}", json=invalid_data)
                    print(f"   Status: {response.status_code}")
                    if response.status_code == 400:
                        print("   ✅ Correctly rejected invalid request")
                        print(f"   Error message: {response.json()}")
                    else:
                        print(f"   ❌ Unexpected status code: {response.status_code}")
                except Exception as e:
                    print(f"   Error: {e}")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test info about specific function
    print(f"\n6. Testing function info endpoint...")
    try:
        if 'test_function_key' in locals():
            module_name, func_name = test_function_key.rsplit(".", 1)
            response = requests.get(f"{base_url}/info/function/{module_name}/{func_name}")
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                info = response.json()
                print(f"   Function info: {json.dumps(info, indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n✅ API testing completed!")
    return True


def main():
    """Main function to run the demo"""
    if len(sys.argv) < 2:
        print("Usage: python test_requests_demo.py <file_or_directory_to_analyze>")
        print("Example: python test_requests_demo.py test_file.py")
        print("Example: python test_requests_demo.py folder_with_func/")
        print("\nThis will start the FastAPI server and test the endpoints.")
        sys.exit(1)
    
    target_path = sys.argv[1]
    
    print(f"Starting FastAPI demo with target: {target_path}")
    
    # Import here to avoid issues if app modules aren't available
    try:
        from app.main import create_app
        import uvicorn
    except ImportError as e:
        print(f"Error importing FastAPI app: {e}")
        print("Make sure you have installed the dependencies with: uv install")
        sys.exit(1)
    
    # Create the app
    app = create_app(target_path)
    
    # Start server in a separate thread
    def run_server():
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    print("Starting server...")
    
    # Wait for server to be ready
    if wait_for_server("http://localhost:8000"):
        print("Server is ready!")
        
        # Run the tests
        test_api_endpoints()
        
        print("\nServer is still running. You can:")
        print("- Visit http://localhost:8000/docs for interactive API documentation")
        print("- Visit http://localhost:8000/info/functions to see discovered functions")
        print("- Press Ctrl+C to stop")
        
        try:
            # Keep the main thread alive
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping server...")
    else:
        print("Failed to start server!")
        sys.exit(1)


if __name__ == "__main__":
    main()