import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import useStore from "../store";
import { useState, useCallback } from "react";
import { stripGraphForExecute } from "../utils/strip-graph";
import { type Graph } from "../utils/strip-graph";

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
        // Process updates in execution order
        result.updates.forEach((update: any) => {
          const nodeId = update.node_id;

          // Update outputs
          Object.entries(update.outputs).forEach(
            ([outputName, outputFieldData]) => {
              const path = [nodeId, "outputs", outputName];
              updateNodeData(path, outputFieldData);
            },
          );

          // Update inputs
          Object.entries(update.inputs).forEach(
            ([argName, argData]: [string, any]) => {
              const valuePath = [nodeId, "arguments", argName, "value"];
              updateNodeData(valuePath, argData.value);
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
  }, [nodes, edges]);

  return (
    <div className="w-full">
      <Button className="w-full" onClick={execute} disabled={loading}>
        {loading ? <LoaderIcon className="animate-spin" /> : "Execute"}
      </Button>
    </div>
  );
}
