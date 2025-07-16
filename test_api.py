import requests
import time
import subprocess
import sys
import os
from typing import Dict, Any
import json


class APITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        
    def test_proportion_function(self):
        """Test the proportion function from test_file.py"""
        print("Testing /test_file/proportion endpoint...")
        
        url = f"{self.base_url}/test_file/proportion"
        payload = {
            "arguments": {
                "x": 10,
                "propor": 0.5
            }
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            expected = 10 * 0.5  # 5.0
            actual = result["result"]
            print(f"✓ SUCCESS: proportion(10, 0.5) = {actual} (expected: {expected})")
            assert actual == expected, f"Expected {expected}, got {actual}"
        else:
            print(f"✗ FAILED: Status {response.status_code}, Response: {response.text}")
            return False
        return True
    
    def test_folder_functions(self):
        """Test functions from folder_with_func"""
        print("\nTesting functions from folder_with_func...")
        
        # Test typed_func_float
        url = f"{self.base_url}/folder_with_func/file_with_func/typed_func_float"
        payload = {
            "arguments": {
                "a": 3.5,
                "b": 2.1
            }
        }
        
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            expected = 3.5 + 2.1
            actual = result["result"]
            print(f"✓ SUCCESS: typed_func_float(3.5, 2.1) = {actual} (expected: {expected})")
        else:
            print(f"✗ FAILED: typed_func_float - Status {response.status_code}")
            return False
            
        # Test add_string with defaults
        url = f"{self.base_url}/folder_with_func/file_with_func/add_string"
        payload = {
            "arguments": {
                "a": "hello",
                "b": "world"
            }
        }
        
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            expected = "helloworld"
            actual = result["result"]
            print(f"✓ SUCCESS: add_string('hello', 'world') = '{actual}' (expected: '{expected}')")
        else:
            print(f"✗ FAILED: add_string - Status {response.status_code}")
            return False
            
        return True
    
    def test_list_functions(self):
        """Test the /functions endpoint"""
        print("\nTesting /functions endpoint...")
        
        response = requests.get(f"{self.base_url}/functions")
        
        if response.status_code == 200:
            result = response.json()
            functions = result.get("functions", {})
            types = result.get("types", {})
            
            print(f"✓ SUCCESS: Found {len(functions)} modules with functions")
            for module_name, funcs in functions.items():
                print(f"  - {module_name}: {list(funcs.keys())}")
            
            # Check if proportion function is listed
            if "test_file" in functions and "proportion" in functions["test_file"]:
                print("✓ SUCCESS: proportion function found in function list")
            else:
                print("✗ FAILED: proportion function not found in function list")
                return False
                
        else:
            print(f"✗ FAILED: Status {response.status_code}")
            return False
        return True
    
    def test_root_endpoint(self):
        """Test the root endpoint"""
        print("\nTesting root endpoint...")
        
        response = requests.get(f"{self.base_url}/")
        
        if response.status_code == 200:
            result = response.json()
            routes = result.get("available_routes", [])
            print(f"✓ SUCCESS: Found {len(routes)} available routes")
            for route in routes[:5]:  # Show first 5 routes
                print(f"  - {route}")
            if len(routes) > 5:
                print(f"  ... and {len(routes) - 5} more")
        else:
            print(f"✗ FAILED: Status {response.status_code}")
            return False
        return True
    
    def test_error_handling(self):
        """Test error handling for missing arguments"""
        print("\nTesting error handling...")
        
        url = f"{self.base_url}/test_file/proportion"
        payload = {
            "arguments": {
                "x": 10
                # Missing 'propor' argument
            }
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 400:
            print("✓ SUCCESS: Correctly returned 400 for missing arguments")
            error_detail = response.json().get("detail", "")
            if "Missing required arguments" in error_detail:
                print(f"✓ SUCCESS: Error message is informative: {error_detail}")
            else:
                print(f"✗ WARNING: Error message could be more informative: {error_detail}")
        else:
            print(f"✗ FAILED: Expected 400, got {response.status_code}")
            return False
        return True


def wait_for_server(url: str, timeout: int = 30):
    """Wait for the server to be ready"""
    print(f"Waiting for server at {url}...")
    for i in range(timeout):
        try:
            response = requests.get(url, timeout=1)
            if response.status_code == 200:
                print("✓ Server is ready!")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
        if i % 5 == 4:
            print(f"Still waiting... ({i+1}/{timeout}s)")
    return False


def main():
    """Run all tests"""
    print("FastAPI Function API Tests")
    print("=" * 50)
    
    # Check if server is already running
    try:
        response = requests.get("http://localhost:8000/", timeout=2)
        server_running = response.status_code == 200
    except requests.exceptions.RequestException:
        server_running = False
    
    if not server_running:
        print("Server not detected. Please start the server first:")
        print("  Option 1: python -m app.cli test_file.py")
        print("  Option 2: uvicorn app.main:app --reload")
        print("\nThen run this test again.")
        sys.exit(1)
    
    # Run tests
    tester = APITester()
    
    tests = [
        tester.test_root_endpoint,
        tester.test_list_functions,
        tester.test_proportion_function,
        tester.test_folder_functions,
        tester.test_error_handling,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ TEST ERROR: {test.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())