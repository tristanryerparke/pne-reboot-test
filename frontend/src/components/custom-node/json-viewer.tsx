import { memo } from "react";
import { JsonViewer as BaseJsonViewer } from "../ui/json-tree-viewer";
import { useNodeData } from "../../store";

interface JsonViewerProps {
  data: any;
  path: (string | number)[];
}

export default memo(function JsonViewer({ data, path }: JsonViewerProps) {
  return (
    <div className={`p-2`}>
      <BaseJsonViewer
        className="w-full h-full"
        data={data}
        rootName="data"
        defaultExpanded={true}
      />
    </div>
  );
});
