import type { FunctionSchema } from "@/types/types";
import { memo, useCallback } from "react";
import NodeStatus from "./node-status";
import useFlowStore from "@/stores/flowStore";

type NodeHeaderProps = {
  data: FunctionSchema;
  nodeId: string;
};

export default memo(function NodeHeader({ data, nodeId }: NodeHeaderProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleToggleDrawer = useCallback(() => {
    const path = [nodeId, "_terminal_drawer", "_expanded"];
    updateNodeData(path, !data._terminal_drawer?._expanded);
  }, [nodeId, data._terminal_drawer?._expanded, updateNodeData]);

  if (!data) {
    return <div>No node data</div>;
  }

  return (
    <div className="h-fit flex items-center justify-between p-1 w-full">
      <span className="px-1 text-sm font-bold shrink-0">{data.name}</span>
      <NodeStatus
        status={data._status ?? "not-executed"}
        onToggleDrawer={handleToggleDrawer}
        hasTerminalOutput={!!data.terminal_output}
        isDrawerOpen={data._terminal_drawer?._expanded ?? false}
      />
    </div>
  );
});
