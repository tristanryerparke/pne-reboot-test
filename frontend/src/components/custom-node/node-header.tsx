import { Button } from "../ui/button";
import { Code, ArrowLeftRight, FileText } from "lucide-react";
import { NodeResizeControl } from "@xyflow/react";

type NodeHeaderProps = {
  data: any;
  nodeId: string;
  isJsonView: boolean;
  onToggleView: () => void;
  onResizeStart?: () => void;
  minWidth?: number;
};

export default function NodeHeader({
  data,
  nodeId,
  isJsonView,
  onToggleView,
  onResizeStart,
  minWidth,
}: NodeHeaderProps) {
  if (!data) {
    return <div>No node data</div>;
  }

  return (
    <div className="h-fit flex items-center p-1 w-full">
      <span className="px-1 text-sm font-bold">{data.name}</span>
      <div className="flex gap-0.5 justify-end items-center ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0"
          onClick={onToggleView}
          title={isJsonView ? "Show Fields" : "Show JSON"}
        >
          {isJsonView ? <FileText size={14} /> : <Code size={14} />}
        </Button>
        <NodeResizeControl
          style={{
            all: "unset",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            width: "fit-content",
            height: "fit-content",
          }}
          autoScale={false}
          resizeDirection="horizontal"
          className="flex justify-center items-center w-fit h-fit"
          nodeId={nodeId}
          minWidth={minWidth || data.min_width}
          maxWidth={data.max_width}
          onResizeStart={onResizeStart}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 cursor-ew-resize"
          >
            <ArrowLeftRight size={14} />
          </Button>
        </NodeResizeControl>
      </div>
    </div>
  );
}
