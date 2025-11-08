1. For the backend I am using `uv` as the package manager and script runner.
    A. Install all python packages using `uv add xxx`
    B. Run all python scripts using `uv run xxx.py`
2. For the frontend (in the 'frontend/') I am using `bun` as the package manager and script runner.
    A. Install all typescript packages using `bun add xxx`
    B. Test for compilation errors using `bunx tsc -b`
    C. Run all scripts using `bunx` instead of `npx` 
    

3. When writing python functions, don't add docstrings unless prompted.
4. When editing python functions, don't add typing on your own unless fixing the types on an already typed function.
