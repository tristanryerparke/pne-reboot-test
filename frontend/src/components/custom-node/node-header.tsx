import { memo } from "react";
import { Button } from "../ui/button";
import { Code, FileText } from "lucide-react";

type NodeHeaderProps = {
  data: any;
  isJsonView: boolean;
  onToggleView: () => void;
};

export default memo(function NodeHeader({
  data,
  isJsonView,
  onToggleView,
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
        {/* <NodeResizeControl
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
          maxWidth={750}
          onResizeStart={onResizeStart}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 cursor-ew-resize"
          >
            <ArrowLeftRight size={14} />
          </Button>
        </NodeResizeControl> */}
      </div>
    </div>
  );
});
