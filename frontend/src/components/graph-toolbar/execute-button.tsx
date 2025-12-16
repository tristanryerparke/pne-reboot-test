import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoaderIcon } from "lucide-react";
import useFlowStore from "../../stores/flowStore";
import { useState, useCallback } from "react";
import { stripGraphForExecute } from "../../utils/strip-graph";
import { type Graph } from "../../utils/strip-graph";
import { preserveUIData } from "../../utils/preserve-ui-data";
import { useBackendConnection } from "../../hooks/useBackendConnection";

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const { isConnected, isChecking } = useBackendConnection();
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
          const { node_id: _node_id, ...updateData } = update; // Remove node_id from update
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

  const isDisabled = loading || !isConnected || isChecking;
  const buttonClass =
    isConnected && !isChecking
      ? "w-25 text-green-700! border-green-700!"
      : "w-25";

  const button = (
    <Button
      className={buttonClass}
      variant="outline"
      size="sm"
      onClick={execute}
      disabled={isDisabled}
    >
      {loading ? <LoaderIcon className="animate-spin" /> : "Execute"}
    </Button>
  );

  if (!isConnected && !isChecking) {
    return (
      <div className="w-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-full">{button}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Backend not connected</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return <div className="w-full">{button}</div>;
}
