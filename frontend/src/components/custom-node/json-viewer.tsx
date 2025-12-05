import { memo } from "react";
import { JsonViewer as BaseJsonViewer } from "../ui/json-tree-viewer";

interface JsonViewerProps {
  data: any;
  className?: string;
  rootName?: string;
  textSize?: string;
  textLimit?: number;
}

export default memo(function JsonViewer({
  data,
  className,
  rootName = "",
  textSize,
  textLimit,
}: JsonViewerProps) {
  return (
    <div className={`p-2 ${className || ""}`}>
      <BaseJsonViewer
        className="w-full h-full"
        data={data}
        rootName={rootName}
        defaultExpanded={true}
        textSize={textSize}
        textLimit={textLimit}
      />
    </div>
  );
});
