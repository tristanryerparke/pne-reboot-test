# FastAPI Dynamic Function Router

This project creates a FastAPI application that automatically generates REST API endpoints from Python functions discovered in files and directories.

## Features

- **Automatic Function Discovery**: Analyzes Python files to find functions with type annotations
- **Dynamic Route Generation**: Creates REST endpoints at `/{module_name}/{function_name}`
- **Type Validation**: Uses function signatures for request/response validation
- **Interactive Documentation**: Automatic OpenAPI/Swagger docs at `/docs`
- **Function Introspection**: Endpoints to discover available functions and their metadata

## Installation

```bash
# Install dependencies using uv
uv sync

# Or install specific dependencies
uv add fastapi[standard] uvicorn pydantic-settings requests pytest httpx
```

## Usage

### Basic Usage

1. **Run with a specific file:**
```bash
python run_fastapi_app.py test_file.py
```

2. **Run with a directory:**
```bash
python run_fastapi_app.py folder_with_func/
```

3. **Using the CLI module:**
```bash
python -m app.cli test_file.py --port 8001 --reload
```

### Example Function

If you have a function like this in `test_file.py`:

```python
def proportion(x: int, propor: float) -> float:
    return x * propor
```

The FastAPI app will automatically create an endpoint at `/test_file/proportion`.

### Making API Calls

**Call the function:**
```bash
curl -X POST "http://localhost:8000/test_file/proportion" \
     -H "Content-Type: application/json" \
     -d '{"arguments": {"x": 10, "propor": 0.5}}'
```

**Response:**
```json
{"result": 5.0}
```

## API Endpoints

### Function Execution
- `POST /{module_name}/{function_name}` - Execute a discovered function
  - Request body: `{"arguments": {"param1": "value1", "param2": "value2"}}`
  - Response: `{"result": "function_result"}`

### Information Endpoints
- `GET /` - Root endpoint showing discovered functions count
- `GET /health` - Health check endpoint
- `GET /info/functions` - List all discovered functions with metadata
- `GET /info/types` - List all discovered types
- `GET /info/function/{module_name}/{function_name}` - Get specific function info

### Interactive Documentation
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

## Testing

### Run the test suite:
```bash
# Run all tests
uv run pytest tests/ -v

# Run specific test file
uv run pytest tests/test_fastapi_app.py -v
```

### Manual testing with requests:
```bash
python test_requests_demo.py test_file.py
```

This will:
1. Start the FastAPI server
2. Test all endpoints automatically
3. Show example API calls
4. Keep the server running for manual testing

## Project Structure

```
app/
├── __init__.py
├── main.py                 # FastAPI application factory
├── cli.py                  # Command-line interface
├── test_file.py           # Example functions to test
├── core/
│   ├── __init__.py
│   └── config.py          # Configuration settings
├── services/
│   ├── __init__.py
│   ├── analyzer.py        # Function analysis logic
│   └── function_discovery.py  # File/directory discovery
└── api/
    ├── __init__.py
    └── routes.py          # Dynamic route generation

tests/
├── __init__.py
└── test_fastapi_app.py    # Comprehensive test suite

run_fastapi_app.py         # Simple startup script
test_requests_demo.py      # Manual testing demo
```

## How It Works

1. **Function Discovery**: The app scans the target path for Python files
2. **Analysis**: Each file is imported and analyzed for functions with type annotations
3. **Route Generation**: For each function, a POST endpoint is created
4. **Request Validation**: Pydantic models validate request arguments against function signatures
5. **Function Execution**: The actual function is called with provided arguments
6. **Response**: Results are returned in a standardized JSON format

## Requirements for Functions

Functions must have:
- **Type annotations** for all parameters and return value
- **No side effects** that would prevent repeated calls
- **Serializable** input/output types (for now - complex types coming later)

Example:
```python
def valid_function(name: str, age: int, active: bool = True) -> str:
    """This function will be automatically discovered"""
    return f"{name} is {age} years old and {'active' if active else 'inactive'}"

# Will create endpoint: POST /module_name/valid_function
# Request: {"arguments": {"name": "John", "age": 30, "active": false}}
# Response: {"result": "John is 30 years old and inactive"}
```

## Error Handling

The API provides detailed error messages for:
- Missing required arguments
- Unexpected arguments  
- Type validation errors
- Function execution errors
- Non-existent functions

## Configuration

Configure the app via environment variables or `app/core/config.py`:

- `APP_NAME`: Application name (default: "Dynamic FastAPI Function Router")
- `DEBUG`: Debug mode (default: True)
- `HOST`: Server host (default: "0.0.0.0")
- `PORT`: Server port (default: 8000)

## Future Enhancements

- [ ] Support for complex type serialization (Pydantic models, dataclasses)
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Async function support
- [ ] WebSocket endpoints
- [ ] Custom route prefixes
- [ ] Function caching
- [ ] Metrics and monitoring

## Examples

See `test_file.py` and `folder_with_func/` for example functions that work with the system.

Run the demo to see it in action:
```bash
python test_requests_demo.py test_file.py
```