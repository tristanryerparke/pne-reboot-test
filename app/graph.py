from devtools import debug as d
from fastapi import APIRouter

from app.large_data.base import CachedDataWrapper
from app.schema import Graph, NodeDataFromFrontend, NodeFromFrontend

router = APIRouter()
VERBOSE = False


def infer_concrete_type(value, type_descriptor, TYPES):
    """Infer the concrete type of a value from a type descriptor.

    Handles both simple types and union types by checking the runtime type
    of the value against the available types.
    """
    from app.schema_base import UnionDescr

    # If it's a union type, find which concrete type matches
    if isinstance(type_descriptor, UnionDescr):
        for candidate_type in type_descriptor.any_of:
            if candidate_type in TYPES:
                type_info = TYPES[candidate_type]
                if isinstance(value, type_info["_class"]):
                    return candidate_type
        raise ValueError(
            f"Value {value} of type {type(value)} does not match any type in union {type_descriptor.any_of}"
        )

    # If it's already a concrete type string, return it
    if isinstance(type_descriptor, str):
        return type_descriptor

    raise ValueError(f"Unknown type descriptor: {type_descriptor}")


@router.post("/graph_execute")
async def execute_graph(graph: Graph):
    """Execute a graph containing nodes and edges"""
    from app.server import TYPES

    execution_list = topological_order(graph)

    if VERBOSE:
        d(execution_list)

    updates = []

    for node in execution_list:
        if VERBOSE:
            print(f"Executing node {node.id}")
        result = execute_node(node.data)

        # Normalize result to dict format
        # For single outputs, wrap in {output_key: value}
        # For multiple outputs, result is already a dict
        if node.data.output_style == "single":
            # Get the actual output key name (e.g., 'return' or 'image_blurred')
            output_key = list(node.data.outputs.keys())[0]
            result_dict = {output_key: result}
        else:
            result_dict = result

        node_update = {"node_id": node.id, "outputs": {}, "inputs": {}}

        # Check if this node received inputs from other nodes via edges
        for edge in graph.edges:
            if edge.target == node.id:
                # Extract the argument name from targetHandle
                argument_name = edge.targetHandle.split(":")[-2]

                # Send a copy of the argument wrapper to frontend
                arg = node.data.arguments[argument_name]
                node_update["inputs"][argument_name] = arg.model_copy()

        # Process all outputs and create the return data model
        for output_name in node.data.outputs.keys():
            data = node.data.outputs[output_name]
            new_value = result_dict[output_name]

            # Infer the concrete type from the runtime value
            concrete_type = infer_concrete_type(new_value, data.type, TYPES)

            # Check if type exists in TYPES and has referenced_datamodel (e.g., Image -> CachedImageDataModel)
            if (
                concrete_type in TYPES
                and "referenced_datamodel" in TYPES[concrete_type]
            ):
                output_class = TYPES[concrete_type]["referenced_datamodel"]
            else:
                # Fall back to DataWrapper for normal types (int, float, str, etc.)
                from app.schema import DataWrapper

                output_class = DataWrapper

            # Programatically create the output data model with the concrete type
            output_data_model = output_class(
                type=concrete_type,
                value=new_value,
            )

            node_update["outputs"][output_name] = output_data_model

        # Propagate outputs to connected nodes via edges
        for edge in graph.edges:
            if edge.source == node.id:
                # Extract the output field name from the sourceHandle
                # Format: nodeId:outputs:outputName:handle
                output_field_name = edge.sourceHandle.split(":")[-2]

                # Extract target argument name from targetHandle
                argument_name = edge.targetHandle.split(":")[-2]

                # Update the target node's arguments with a copy of the output wrapper
                target_node = next(n for n in execution_list if n.id == edge.target)

                target_node.data.arguments[argument_name] = node_update["outputs"][
                    output_field_name
                ].model_copy()

        updates.append(node_update)

    update_message = {
        "status": "success",
        "updates": updates,
    }

    if VERBOSE:
        d(update_message)

    return update_message


def execute_node(node: NodeDataFromFrontend):
    """Finds a node's callable and executes it with the arguments from the frontend"""
    from app.server import CALLABLES

    callable = CALLABLES[node.callable_id]

    # Check if this function has list_inputs enabled
    if getattr(callable, "list_inputs", False):
        # For list_inputs functions:
        # - Named parameters (e.g., arg1) are passed as positional args first
        # - Numbered parameters (0, 1, 2...) are passed as *args after
        numbered_args = {}
        named_args = {}

        for k, v in node.arguments.items():
            arg_value = v.value

            # Handle both "_0", "_1" and "0", "1" naming patterns
            if k.isdigit():
                numbered_args[int(k)] = arg_value
            else:
                named_args[k] = arg_value

        # Sort numbered args by index
        sorted_numbered_args = [numbered_args[i] for i in sorted(numbered_args.keys())]

        # Get named args values in order (maintain dict order from frontend)
        named_args_values = list(named_args.values())

        # Combine: named parameters first, then dynamic numbered inputs
        all_args = named_args_values + sorted_numbered_args

        return callable(*all_args)
    # Check if this function has dict_inputs enabled
    elif getattr(callable, "dict_inputs", False):
        # For dict_inputs functions, all arguments are passed as **kwargs
        # The frontend should send them with their key names
        args = {}
        for k, v in node.arguments.items():
            args[k] = v.value

        return callable(**args)
    else:
        # Normal execution with kwargs
        args = {}
        print("Node arguments being printed:")
        d(node.arguments)
        for k, v in node.arguments.items():
            args[k] = v.value

        return callable(**args)


def topological_order(graph: Graph) -> list[NodeFromFrontend]:
    """
    Returns all nodes in topological order using DFS.
    Ensures dependencies are executed before dependents.
    """
    result: list[NodeFromFrontend] = []
    visited: set[str] = set()

    # Create a mapping from node_id to NodeFromFrontend for quick lookup
    node_map: dict[str, NodeFromFrontend] = {node.id: node for node in graph.nodes}

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        # Visit dependencies (sources) of this node first
        for edge in graph.edges:
            if edge.target == node_id:
                visit(edge.source)

        result.append(node_map[node_id])

    # Sort nodes by x-coordinate (left to right) to establish execution order for unconnected nodes
    sorted_nodes = sorted(
        graph.nodes, key=lambda node: node.position["x"] if node.position else 0
    )

    # Visit all nodes in sorted order
    for node in sorted_nodes:
        visit(node.id)

    return result
