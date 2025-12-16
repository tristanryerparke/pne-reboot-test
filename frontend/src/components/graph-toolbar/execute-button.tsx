import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import useFlowStore from "../../stores/flowStore";
import { useState, useCallback } from "react";
import { stripGraphForExecute } from "../../utils/strip-graph";
import { type Graph } from "../../utils/strip-graph";
import { preserveUIData } from "../../utils/preserve-ui-data";

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const getNodeData = useFlowStore((state) => state.getNodeData);

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

          // Get existing node data and merge while preserving ui only-data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingNodeData = getNodeData([nodeId]) as any;
          const { node_id, ...updateData } = update; // Remove node_id from update
          const mergedNodeData = preserveUIData(existingNodeData, updateData);

          // Update the entire node data at once
          updateNodeData([nodeId], mergedNodeData);

          // Log errors for debugging
          if (update._status === "error") {
            console.error(
              `Node ${nodeId} failed with output:`,
              update.terminal_output,
            );
          }
        });
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
