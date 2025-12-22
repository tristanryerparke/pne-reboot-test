There are several ways to use install and use Python Node Editor:

1. **Clone the Repository**
For beginner use and development, it is recommended to clone the repository in order to learn how PNE works.

- `git clone https://github.com/tristanryerparke/python-node-editor`
- `cd python-node-editor`

The basic command line scripts will available in this directory.
- `uv run pne examples/integer_math.py`
- `uv run pne my_file_that_i_added_in_the_repository_root.py`

From there you can follow the [Usage Introductions](Usage-Introduction.md) and also run PNE in [development](Development.md) mode.

2. **Install in another package package with `uv`**

In your own uv project you can install PNE like so:

- `uv add git+https://github.com/tristanryerparke/python-node-editor`

Then from within that project you should be able to use the normal PNE command line utilities:

- `uv run pne my-file-with-functions.py` where "my-file-with-functions.py" is the file containing the functions you want PNE to consume. 

Note that this above method uses a packaged/static version of PNE (frontend and backend) that is not editable and does not contain the examples. If you want to use a version of PNE that you have modified in an external project, then you should use method 3.

3. **Install your local copy as a linked/editable package**

This is an advanced use case for when you have modified PNE and want to use your modified version in another project.

Make sure you have cloned the repo as described in step 1, then run this command in your project's root directory:

- `uv pip install -e /path/to/where/i/cloned/python-node-editor`, replacing the path with the actual path to your cloned and modified instance of the pne repository.

If you have made modifications to the frontend in your cloned location, you should ensure that you are using an up-to-date version of the frontend by following the instructions in the [Development.md](Development.md) file.
