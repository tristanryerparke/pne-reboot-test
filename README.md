



### Python Node Editor (PNE)

Let's say your python project is too flexible/modular to keep re-writing a frontend for it. Or maybe you don't want to keep looking at code while you're running some python functions you wrote while tweaking the inputs.

To make functions usable on the frontend, all you have to do is fully type annotate them.

Please See the [Basic Usage](https://github.com/tristanryerparke/python-node-editor/wiki/Basic-Usage) wiki page to get started.

Backend Server CLI usage (for frontend dev server workflows): `uv run pne-backend path/to/file.py`

Arguments:
- `--port`: The port to run the backend on. Default is 8000.
- `--host`: The host to run the backend on. Default is 127.0.0.1.
- `-v`, `--verbose`: Enable verbose logging.
- `--do_not_ignore_underscore_prefix`: Do not ignore underscore prefixed files and folders when looking for functions to analyze.

Frontend + Backend (normal operation, builds frontend): `uv run pne path/to/file.py`

Arguments:
- `--port`: The port to run the backend on. Default is 8000.
- `--host`: The host to run the backend on. Default is 127.0.0.1.
- `-v`, `--verbose`: Enable verbose logging.
- `-bf`, `--build_frontend`: Force rebuild of the frontend into `frontend/prebuilt` before serving.
- `--do_not_ignore_underscore_prefix`: Do not ignore underscore prefixed files and folders when looking for functions to analyze.

Backend Server Analysis: `uv run pne-analyze path/to/file.py`

Arguments:
- `-v`, `--verbose`: Enable verbose logging.
- `--do_not_ignore_underscore_prefix`

Build Frontend Only: `uv run pne-build-frontend`
