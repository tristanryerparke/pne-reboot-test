"""Utility functions for building graph structures in tests."""

from app.schema import FunctionSchema, NodeDataFromFrontend, NodeFromFrontend


def node_from_schema(
    node_id: str,
    schema: FunctionSchema,
    position: dict[str, float] | None = None,
) -> NodeFromFrontend:
    """This is a testing-only function designed to mimic the construction of a "NodeFromFrontend" instance
    that would happen when the user drags and drops a schema onto the react flow canvas, and then presses
    the execute button to send the flow data to the backend.


    """
    if position is None:
        position = {"x": 0, "y": 0}

    node_data = NodeDataFromFrontend(
        callable_id=schema.callable_id,
        arguments=schema.arguments.copy(),
        outputs=schema.outputs.copy(),
        output_style=schema.output_style,
    )

    return NodeFromFrontend(
        id=node_id,
        position=position,
        data=node_data,
    )
