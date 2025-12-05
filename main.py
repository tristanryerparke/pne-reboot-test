"""Usually we run the backend via it's uv cli tool, but this file lets us run it with debugpy"""

from app.server import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
