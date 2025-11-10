def main():
    import uvicorn

    from app.server import app

    uvicorn.run(app, host="127.0.0.1", port=8000)
