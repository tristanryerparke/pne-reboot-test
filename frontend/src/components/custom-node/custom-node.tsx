import { memo, useState, useRef, useEffect } from "react";
import NodeHeader from "./node-header";
import Inputs from "./inputs/inputs";
import Outputs from "./outputs/outputs";
import JsonViewer from "./json-viewer";
import { Separator } from "../ui/separator";

export default memo(function CustomNode({
  data,
  id,
}: {
  data: any;
  id: string;
}) {
  const [isJsonView, setIsJsonView] = useState(false);
  const [isResized, setIsResized] = useState(false);
  const [fitWidth, setFitWidth] = useState<number | undefined>(undefined);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Measure the fit width when not resized
  useEffect(() => {
    if (!isResized && nodeRef.current) {
      const width = nodeRef.current.offsetWidth;
      setFitWidth(width);
    }
  }, [isResized, isJsonView]);

  const toggleView = () => setIsJsonView(!isJsonView);

  const handleResizeStart = () => {
    if (nodeRef.current && !fitWidth) {
      setFitWidth(nodeRef.current.offsetWidth);
    }
    setIsResized(true);
  };

  const path = [id];

  // console.log(data);

  return (
    <div
      ref={nodeRef}
      className={`${
        isResized
          ? "relative h-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground"
          : "relative w-fit h-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground"
      }`}
      style={{
        maxHeight: "fit-content",
        overflowY: "visible",
        resize: "horizontal",
      }}
    >
      <NodeHeader
        data={data}
        nodeId={id}
        isJsonView={isJsonView}
        onToggleView={toggleView}
        onResizeStart={handleResizeStart}
        minWidth={fitWidth}
      />
      <Separator />
      {isJsonView ? (
        <JsonViewer data={data} path={[id]} />
      ) : (
        <>
          <Inputs data={data} nodeId={id} path={path} />
          <Separator />
          <Outputs data={data} path={path} />
        </>
      )}
    </div>
  );
});
