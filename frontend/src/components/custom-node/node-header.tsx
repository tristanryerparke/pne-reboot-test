import type { FunctionSchema } from "@/types/types";
import { memo } from "react";
import NodeStatus from "./node-status";

type NodeHeaderProps = {
  data: FunctionSchema;
};

export default memo(function NodeHeader({ data }: NodeHeaderProps) {
  if (!data) {
    return <div>No node data</div>;
  }

  return (
    <div className="h-fit flex items-center justify-between p-1 w-full">
      <span className="px-1 text-sm font-bold shrink-0">{data.name}</span>
      <NodeStatus status={data._status || "not-executed"} />
    </div>
  );
});
