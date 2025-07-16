

- Node editor should be a backend separate from the code of a node.
- A node should be able to be created out of any typed python function and almost no boilerplate should be necessary. 
	- The backend itself is almost like a type checker program and can be directed at folders or files containing typed python functions in order to serve them.
	- Untyped functions will cause errors.
	- Function annotations other than typing should be optional.
	- All de/serialization, caching, and publishing of function information should be handled by backend parser and server.
- All datatypes/classes (native or user-created) used in type annotation should be collected and shown on the frontend. This could potentially help people write the JS portions for their plugins.
- All basic python datatypes and user classes based on them should be builtin to frontend for display.

#### Questions / Things to Figure Out:
- Could the backend be written in something other than python? rust? Hard because it does have to execute python code.
- Possible to take advantage of python's native type coercion, and let any node output plug into an input. Validation only occurs to indicate which argument was bad. 
- There could also be a strict mode where connections can't be coerced unless unions are used.
- Operation modes:
	- No websockets might allow for easier definition of schema? Maybe there is a solution to this. Could also enable usage on runpod serverless or similar powerful way to run backend.
	

#### Inspirations:

| Program           | Pros                                                                                                                    | Cons                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grasshopper       | Nested flows<br><br>                                                                                                    | Geometry-specific<br>No dicts / data flow complicated<br>Not speed or parallel optimized<br>Graphical display is limited<br>Not OSS or free<br>Dependent on Rhino |
| Jupyter Notebook  | - Somewhat visual / bite sized code<br>- Good options for graphical display / interactivity<br>- Serious Processing<br> | A lot of globals...?<br>                                                                                                                                          |
| Runpod Serverless | - Good docs for wrapping your function up so it can be used elsewhere, minimal boilerplate.<br>                         | Debugging production env difficult to set up                                                                                                                      |
| ComfyUI           | - Headless running / backend can be decoupled<br>- Flow Save / Load<br>- Flow embedded into result                      | - Relatively limited to images<br>- Big boilerplate for custom nodes<br>                                                                                          |
| Chainner          | - Typed python backend / ts frontend<br>-                                                                               | - Relatively limited to images<br>- Big boilerplate for custom nodes                                                                                              |
|                   |                                                                                                                         |                                                                                                                                                                   |






