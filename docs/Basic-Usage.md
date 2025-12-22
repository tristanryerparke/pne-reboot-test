Let's say your python project is too flexible/modular to keep re-writing a frontend for it. Or maybe you don't want to keep looking at code while you're running some python functions you wrote while tweaking the inputs.

To make functions usable on the frontend, all you have to do is fully type annotate them.

Here's a sample typed function in [basic_percentage.py](https://github.com/tristanryerparke/python-node-editor/blob/main/examples/basic_percentage.py) that calculates a percentage of the given number `x`.
```python
def percentage(x: float, percentage: int) -> float:
    return x * (percentage / 100)
```

Now, if you run `uv run main.py examples/basic_percentage.py`, you'll notice the following output:
```
INFO:     Started server process [37465]
INFO:     Waiting for application startup.
Analyzing examples/basic_percentage.py:
Found 1 functions and 2 types
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Then, in a separate terminal run `bun run dev` and navigate to the frontend's url.
Drag the "Percentage" node onto the canvas and you should see the following:

<img alt="Screenshot 2025-11-10 at 12 29 09" src="https://github.com/user-attachments/assets/a9028fa3-b9e0-43dc-b652-fbfbacefa65c" />

Type in `50` in the "x" field and `25` in the "percentage" field, press the execute button and you should see a result of `12.5`.

This means the backend just ran your python program using the arguments you set via the graphical interface, and displayed the result:

<img alt="Screenshot 2025-11-10 at 12 29 48" src="https://github.com/user-attachments/assets/a0a10275-3aa7-485c-bea6-2541a06a7516" />

Now, drag a second percentage node to the canvas and attach the output from the first node into the `x` input field on the new node.
Configure the percentage field as `50%` and run the code. You should get this result:
<img alt="Screenshot 2025-11-10 at 12 37 32" src="https://github.com/user-attachments/assets/457c7b08-987b-4c6a-900f-e073dfa5a350" />

Based on the connection (or edge) that you made, the backend piped the output of the first node into the input of the second node, ran both, and posted the results back to the frontend.
