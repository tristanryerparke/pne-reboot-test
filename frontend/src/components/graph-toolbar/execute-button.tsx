import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LoaderIcon } from "lucide-react";
import useSettingsStore from "../../stores/settingsStore";
import { useState, useCallback } from "react";
import { type Graph } from "../../utils/strip-graph";
import { useBackendConnection } from "../../hooks/useBackendConnection";
import { useExecuteFlowSync } from "../../hooks/useExecuteFlowSync";
import { useExecuteFlowAsync } from "../../hooks/useExecuteFlowAsync";
import { clearOutputsAndConnectedInputs } from "../../utils/clear-outputs";

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const { isConnected, isChecking } = useBackendConnection();
  const executionMode = useSettingsStore((state) => state.executionMode);

  const { execute: executeSyncFn } = useExecuteFlowSync();
  const { execute: executeAsyncFn } = useExecuteFlowAsync();

  const execute = useCallback(async () => {
    setLoading(true);
    const { nodes: clearedNodes, edges: clearedEdges } =
      clearOutputsAndConnectedInputs();
    const graph: Graph = {
      nodes: clearedNodes,
      edges: clearedEdges,
    };

    try {
      if (executionMode === "sync") {
        await executeSyncFn(graph);
      } else {
        await executeAsyncFn(graph);
      }
    } catch (error) {
      console.error("Error executing graph:", error);
    } finally {
      setLoading(false);
    }
  }, [executionMode, executeSyncFn, executeAsyncFn]);

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
