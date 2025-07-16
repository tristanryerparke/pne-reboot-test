# Dynamic Function API

A FastAPI application that automatically generates REST API endpoints based on Python functions found in your codebase.

## Features

- **Automatic Route Generation**: Scans Python files and creates API endpoints for each function
- **Dynamic Discovery**: Can analyze a specific file or entire directory structure
- **Type Validation**: Uses function type hints for request/response validation
- **Interactive Documentation**: Automatic OpenAPI/Swagger documentation
- **Error Handling**: Validates required arguments and provides helpful error messages

## Installation

```bash
# Install dependencies
uv sync
```

## Usage

### Option 1: Start server for specific file/directory

```bash
# Analyze and serve functions from a specific file
python -m app.cli test_file.py

# Analyze and serve functions from a directory
python -m app.cli folder_with_func/
```

### Option 2: Start server with all functions (default)

```bash
# Using uvicorn directly
uvicorn app.main:app --reload

# Or using Python
python -m app.main
```

The server will start at `http://localhost:8000`

## API Endpoints

### Automatically Generated Function Endpoints

Each Python function becomes available as a POST endpoint:

- **Pattern**: `/{module_path}/{function_name}`
- **Method**: POST
- **Request Body**: 
  ```json
  {
    "arguments": {
      "param1": value1,
      "param2": value2
    }
  }
  ```
- **Response**:
  ```json
  {
    "result": function_return_value
  }
  ```

### Example: proportion function

From `test_file.py`:
```python
def proportion(x: int, propor: float) -> float:
    return x * propor
```

Available at: `POST /test_file/proportion`

Request:
```json
{
  "arguments": {
    "x": 10,
    "propor": 0.5
  }
}
```

Response:
```json
{
  "result": 5.0
}
```

### Built-in Endpoints

- **GET /** - List all available routes
- **GET /functions** - Get detailed function and type information
- **GET /docs** - Interactive API documentation (Swagger UI)
- **GET /redoc** - Alternative API documentation

## Examples

### Test with curl

```bash
# Test the proportion function
curl -X POST "http://localhost:8000/test_file/proportion" \
     -H "Content-Type: application/json" \
     -d '{"arguments": {"x": 10, "propor": 0.5}}'

# Test a function with string arguments
curl -X POST "http://localhost:8000/folder_with_func/file_with_func/add_string" \
     -H "Content-Type: application/json" \
     -d '{"arguments": {"a": "hello", "b": "world"}}'
```

### Test with Python requests

```python
import requests

# Test the proportion function
response = requests.post(
    "http://localhost:8000/test_file/proportion",
    json={"arguments": {"x": 10, "propor": 0.5}}
)
print(response.json())  # {"result": 5.0}
```

## Running Tests

```bash
# Start the server first
python -m app.cli test_file.py

# In another terminal, run tests
python test_api.py
```

The test suite will:
- Test the proportion function endpoint
- Test functions from folder_with_func
- Test error handling for missing arguments
- Verify all endpoints are properly registered

## File Structure

```
app/
├── __init__.py
├── main.py          # Main FastAPI application
└── cli.py           # Command-line interface

test_api.py          # Test suite using requests
FASTAPI_README.md    # This documentation
```

## Requirements

- Python 3.12+
- FastAPI
- Uvicorn
- Pydantic v2
- Requests (for testing)

## Limitations

- Currently supports simple types (int, float, str, bool)
- Complex types and classes are not yet fully supported for serialization
- Functions must have complete type annotations

## Development

The application uses the existing `analyze_file.py` module to discover and analyze Python functions, then dynamically creates FastAPI routes for each discovered function.

Key components:
- `create_app()`: Main application factory
- `create_function_route()`: Generates individual routes for functions
- `FunctionCallRequest`/`FunctionCallResponse`: Pydantic models for API

## Future Enhancements

- Support for complex type serialization (Pydantic models, custom classes)
- WebSocket support for streaming functions
- Authentication and authorization
- Rate limiting
- Caching of function results