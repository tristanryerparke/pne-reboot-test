import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import useFlowStore from "../../stores/flowStore";
import { useState, useCallback } from "react";
import { stripGraphForExecute } from "../../utils/strip-graph";
import { type Graph } from "../../utils/strip-graph";

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const execute = useCallback(async () => {
    setLoading(true);
    const graph: Graph = {
      nodes: nodes,
      edges: edges,
    };
    const executeMessage = stripGraphForExecute(graph);

    try {
      console.log("Executing graph:", executeMessage);
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
        // Process updates in execution order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.updates.forEach((update: any) => {
          const nodeId = update.node_id;

          // Update inputs
          Object.entries(update.inputs).forEach(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([argName, argData]: [string, any]) => {
              const valuePath = [nodeId, "arguments", argName, "value"];
              updateNodeData(valuePath, argData.value);
            },
          );

          // Update outputs
          Object.entries(update.outputs).forEach(
            ([outputName, outputFieldData]) => {
              const path = [nodeId, "outputs", outputName];
              updateNodeData(path, outputFieldData);
            },
          );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  return (
    <div className="w-full">
      <Button
        className="w-25 text-green-700! border-green-700!"
        variant="outline"
        size="sm"
        onClick={execute}
        disabled={loading}
      >
        {loading ? <LoaderIcon className="animate-spin" /> : "Execute"}
      </Button>
    </div>
  );
}
