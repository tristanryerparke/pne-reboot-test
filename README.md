



### Python Node Editor..... 

Let's say your python project is too flexible/modular to keep re-writing a frontend for it. Or maybe you don't want to keep looking at code while you're running some python functions you wrote on a few different inputs. 

To make functions usable on the frontend, all you have to do is fully type them.

Here's a sample function in `test_file.py` that gives you a value equal to a proportion of an integer:
```python
def proportion(x: int, propor: float) -> float:
    return x * propor
```

Now, if you run `python main.py test_file.py`, you'll notice the following printed summary:

```
main.py:36 <module>
    functions_info: {
        'proportion': {
            'callable': <function proportion at 0x100735800>,
            'category': [
                'test_file',
            ],
            'arguments': {
                'x': {
                    'type': 'int',
                },
                'propor': {
                    'type': 'float',
                },
            },
            'return': {
                'type': 'float',
            },
        },
    } (dict) len=1
main.py:37 <module>
    types_dict: {
        'int': {
            'class': <class 'int'>,
            'kind': 'builtin',
        },
        'float': {
            'class': <class 'float'>,
            'kind': 'builtin',
        },
    } (dict) len=2
```

This is a dictionary of type information for the function.

Later on, the project will consist of the following:
- A backend that serves this function information for all python files in a directory, plus a set of default functions.
- A frontend that uses this information to create a node-based editor. In which the user can edit the inputs, string functions together, execute the functions, and see the outputs.

It is important to note that prompting the backend with a function of your is supposed to be as simple as possible. 

There may be decorators for named outputs, or other things that enhance the display of the function as a node in the frontend, but the backend should be able to consume the simplest of functions and make it avalaible to the frontend.

See [planning.md](planning.md) for more details on the plan for the structure / features of the project.










