import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import useStore from "../store";
import { useState, useCallback } from "react";
import { stripGraphForExecute } from "../utils/strip-graph";
import { Graph } from "../types/graph";

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const execute = useCallback(async () => {
    setLoading(true);
    const graph: Graph = {
      nodes: nodes,
      edges: edges,
    };
    const executeMessage = stripGraphForExecute(graph);

    try {
      const response = await fetch("http://localhost:8000/graph_execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(executeMessage),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "success") {
        // Update outputs for each node
        Object.entries(result.output_updates).forEach(
          ([nodeId, outputData]) => {
            // Find the node to check its output_style
            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return;

            const outputStyle = node.data.output_style;

            if (outputStyle === "multiple") {
              // Multiple outputs - update each output field individually
              Object.entries(outputData as Record<string, any>).forEach(
                ([outputName, outputFieldData]) => {
                  const path = [nodeId, "outputs", outputName];
                  updateNodeData(path, outputFieldData);
                },
              );
            } else {
              // Single output - update the "return" field
              const path = [nodeId, "outputs", "return"];
              updateNodeData(path, outputData as any);
            }
          },
        );

        // Update inputs for nodes that received values from connections
        Object.entries(result.input_updates).forEach(([nodeId, inputData]) => {
          // Find the corresponding edge to get the target handle information
          const relevantEdge = edges.find((edge) => edge.target === nodeId);
          if (relevantEdge) {
            // Extract the argument name from the target handle
            const handleParts = relevantEdge.targetHandle.split(":");
            const argumentName = handleParts[2]; // Format: nodeId:arguments:argumentName:handle

            // Get the argument data and update only the value property
            Object.entries(
              inputData as Record<string, { value: any; type: string }>,
            ).forEach(([argName, argData]) => {
              const valuePath = [nodeId, "arguments", argName, "value"];
              updateNodeData(valuePath, argData.value);
            });
          }
        });

        console.log("Graph execution completed successfully");
      } else {
        console.error("Graph execution failed:", result.message);
      }
    } catch (error) {
      console.error("Error executing graph:", error);
    } finally {
      setLoading(false);
    }
  }, [nodes, edges]);

  return (
    <div className="w-full">
      <Button className="w-full" onClick={execute} disabled={loading}>
        {loading ? <LoaderIcon className="animate-spin" /> : "Execute"}
      </Button>
    </div>
  );
}
