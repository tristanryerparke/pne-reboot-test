import requests
import sys


def test_api():
    """Test the FastAPI endpoints"""
    base_url = "http://127.0.0.1:8000"

    try:
        # Test 1: Check root endpoint
        print("\n1. Testing root endpoint...")
        response = requests.get(f"{base_url}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200

        # Test 2: List all functions
        print("\n2. Testing functions list endpoint...")
        response = requests.get(f"{base_url}/functions")
        print(f"Status: {response.status_code}")
        functions = response.json()
        print(f"Available functions: {list(functions.keys())}")
        assert response.status_code == 200

        # Test 3: Call the proportion function from test_file.py
        print("\n3. Testing proportion function...")
        payload = {"arguments": {"x": 10, "propor": 0.5}}

        response = requests.post(f"{base_url}/test_file/proportion", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            result = response.json()["result"]
            expected = 10 * 0.5
            print(f"Expected: {expected}, Got: {result}")
            assert result == expected, f"Expected {expected}, got {result}"
            print("✅ Proportion function test passed!")
        else:
            print(f"❌ Error calling proportion function: {response.text}")

        # Test 4: Test with different parameters
        print("\n4. Testing proportion function with different parameters...")
        payload = {"arguments": {"x": 20, "propor": 0.75}}

        response = requests.post(f"{base_url}/test_file/proportion", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            result = response.json()["result"]
            expected = 20 * 0.75
            print(f"Expected: {expected}, Got: {result}")
            assert result == expected, f"Expected {expected}, got {result}"
            print("✅ Second proportion function test passed!")

        # Test 5: Test error handling - missing argument
        print("\n5. Testing error handling...")
        payload = {
            "arguments": {
                "x": 10
                # Missing propor argument
            }
        }

        response = requests.post(f"{base_url}/test_file/proportion", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 400  # Should return bad request
        print("✅ Error handling test passed!")

        # Test 6: Test non-existent function
        print("\n6. Testing non-existent function...")
        payload = {"arguments": {}}

        response = requests.post(f"{base_url}/test_file/nonexistent", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 404  # Should return not found
        print("✅ Non-existent function test passed!")

        print("\n🎉 All tests passed!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

    # finally:
    #     # Stop the server
    #     print("\nStopping server...")
    #     server_process.terminate()
    #     server_process.wait()

    return True


if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)
