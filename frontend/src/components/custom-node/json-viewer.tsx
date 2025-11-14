import { memo } from "react";
import { JsonViewer as BaseJsonViewer } from "../ui/json-tree-viewer";
import { useNodeData } from "../../stores/flowStore";

interface JsonViewerProps {
  data: any;
  className?: string;
}

export default memo(function JsonViewer({ data, className }: JsonViewerProps) {
  return (
    <div className={`p-2 ${className || ""}`}>
      <BaseJsonViewer
        className="w-full h-full"
        data={data}
        rootName="data"
        defaultExpanded={true}
      />
    </div>
  );
});
