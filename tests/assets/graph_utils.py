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

    # We need to copy thin inputs and outputs in case multiple nodes are created from the same schema
    node_data = NodeDataFromFrontend(
        callable_id=schema.callable_id,
        arguments={
            key: value.model_copy(deep=True) for key, value in schema.arguments.items()
        },
        outputs={
            key: value.model_copy(deep=True) for key, value in schema.outputs.items()
        },
        output_style=schema.output_style,
    )

    return NodeFromFrontend(
        id=node_id,
        position=position,
        data=node_data,
    )
