



### Python Node Editor..... 

Let's say your python project is too flexible/modular to keep re-writing a frontend for it. Or maybe you don't want to keep looking at code while you're running some python functions you wrote while tweaking the inputs.

To make functions usable on the frontend, all you have to do is fully type annotate them.

Here's a sample typed function in `test_file.py` that gives you the value of a percent of a given number.
```python
def percentage(x: float, percentage: int) -> float:
    return x * (percentage / 100)
```

Now, if you run `uvx --from . pne-server test_file.py`, you'll notice the following output:
```
INFO:     Started server process [62524]
INFO:     Waiting for application startup.
Analyzing folder_with_files/test_file.py:
Found 4 functions and 2 types
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Then, in a separate terminal run `bun run dev` and navigate to the frontend's url.
Drag the "Percentage" node onto the canvas and you should see the following:

<img alt="Screenshot 2025-11-06 at 13 29 05" src="https://github.com/user-attachments/assets/e75bb390-7050-4707-8f15-6f6c2b19540b" />


Type in `50` in the "x" field and `25` in the "percentage" field, press the execute button and you should see a result of `12.5`.

This means the backend just ran your python program using the arguments you set via the graphical interface, and displayed the result.


It is important to note that prompting the backend with a function of your is supposed to be as simple as possible. 

There may be decorators for named outputs, or other things that enhance the display of the function as a node in the frontend, but the backend should be able to consume the simplest of functions and make it avalaible to the frontend.
