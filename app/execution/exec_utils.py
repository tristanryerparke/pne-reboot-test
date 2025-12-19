import io
import sys
import traceback

from app.schema import Graph, NodeDataFromFrontend, NodeFromFrontend
from app.schema_base import StructDescr, UnionDescr

VERBOSE = False


def infer_concrete_type(value, type_descriptor, TYPES):
    """Infer the concrete type of a value from a type descriptor.

    Handles both simple types and union types by checking the runtime type
    of the value against the available types.
    """
    if isinstance(type_descriptor, UnionDescr):
        for candidate_type in type_descriptor.any_of:
            if candidate_type in TYPES:
                type_def = TYPES[candidate_type]
                if isinstance(value, type_def._class):
                    return candidate_type
        raise ValueError(
            f"Value {value} of type {type(value)} does not match any type in union {type_descriptor.any_of}"
        )

    if isinstance(type_descriptor, StructDescr):
        return type_descriptor

    if isinstance(type_descriptor, str):
        return type_descriptor

    raise ValueError(f"Unknown type descriptor: {type_descriptor}")


def execute_node(node: NodeDataFromFrontend):
    """Finds a node's callable and executes it with the arguments from the frontend"""
    from app.server import CALLABLES

    callable = CALLABLES[node.callable_id]

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_output = io.StringIO()
    sys.stdout = captured_output
    sys.stderr = captured_output

    try:
        if getattr(callable, "list_inputs", False):
            numbered_args = {}
            named_args = {}

            for k, v in node.arguments.items():
                arg_value = v.value

                if k.isdigit():
                    numbered_args[int(k)] = arg_value
                else:
                    named_args[k] = arg_value

            sorted_numbered_args = [
                numbered_args[i] for i in sorted(numbered_args.keys())
            ]

            named_args_values = list(named_args.values())

            all_args = named_args_values + sorted_numbered_args

            result = callable(*all_args)
        elif getattr(callable, "dict_inputs", False):
            args = {}
            for k, v in node.arguments.items():
                args[k] = v.value

            result = callable(**args)
        else:
            args = {}
            for k, v in node.arguments.items():
                args[k] = v.value

            result = callable(**args)

        sys.stdout = old_stdout
        sys.stderr = old_stderr
        terminal_output = captured_output.getvalue()

        if terminal_output:
            print(terminal_output, end="")

        return (True, result, terminal_output if terminal_output else None)
    except Exception as e:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        terminal_output = captured_output.getvalue()
        tb = e.__traceback__
        if tb and tb.tb_next:
            tb = tb.tb_next
            formatted_tb = "".join(traceback.format_exception(type(e), e, tb))
        else:
            formatted_tb = traceback.format_exc()

        if terminal_output:
            print(terminal_output, end="")
        print(formatted_tb, end="")

        combined_output = ""
        if terminal_output:
            combined_output += terminal_output
        combined_output += formatted_tb

        return (False, None, combined_output)


def topological_order(graph: Graph) -> list[NodeFromFrontend]:
    """
    Returns all nodes in topological order using DFS.
    Ensures dependencies are executed before dependents.
    """
    result: list[NodeFromFrontend] = []
    visited: set[str] = set()

    node_map: dict[str, NodeFromFrontend] = {node.id: node for node in graph.nodes}

    def visit(node_id: str):
        if node_id in visited:
            return
        visited.add(node_id)

        for edge in graph.edges:
            if edge.target == node_id:
                visit(edge.source)

        result.append(node_map[node_id])

    sorted_nodes = sorted(
        graph.nodes, key=lambda node: node.position["x"] if node.position else 0
    )

    for node in sorted_nodes:
        visit(node.id)

    return result


def create_node_update(
    node, success, result, terminal_output, graph, execution_list, TYPES
):
    """Create a node update object from execution results"""
    from app.schema import DataWrapper, MultipleOutputs

    node_update = {"node_id": node.id, "outputs": {}, "arguments": {}}

    node_update["terminal_output"] = terminal_output if terminal_output else ""

    if not success:
        node_update["status"] = "error"
        return node_update

    node_update["status"] = "executed"

    if node.data.output_style == "single":
        output_key = list(node.data.outputs.keys())[0]
        result_dict = {output_key: result}
    else:
        if isinstance(result, MultipleOutputs):
            result_dict = result.model_dump()
        else:
            result_dict = result

    for edge in graph.edges:
        if edge.target == node.id:
            argument_name = edge.targetHandle.split(":")[-2]
            arg = node.data.arguments[argument_name]
            node_update["arguments"][argument_name] = arg.model_copy()

    for output_name in node.data.outputs.keys():
        data = node.data.outputs[output_name]
        new_value = result_dict[output_name]

        concrete_type = infer_concrete_type(new_value, data.type, TYPES)

        if (
            isinstance(concrete_type, str)
            and concrete_type in TYPES
            and hasattr(TYPES[concrete_type], "_referenced_datamodel")
            and TYPES[concrete_type]._referenced_datamodel is not None
        ):
            output_class = TYPES[concrete_type]._referenced_datamodel
        else:
            output_class = DataWrapper

        output_data_model = output_class(
            type=concrete_type,
            value=new_value,
        )

        node_update["outputs"][output_name] = output_data_model

    for edge in graph.edges:
        if edge.source == node.id:
            output_field_name = edge.sourceHandle.split(":")[-2]
            argument_name = edge.targetHandle.split(":")[-2]

            target_node = next(n for n in execution_list if n.id == edge.target)

            target_node.data.arguments[argument_name] = node_update["outputs"][
                output_field_name
            ].model_copy()

    return node_update
