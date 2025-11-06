import { memo, useState, useRef, useEffect } from "react";
import NodeHeader from "./node-header";
import InputFieldComponent from "./input-field";
import OutputFieldComponent from "./output-field";
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

  // console.log(data)

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
          <div>
            {Object.entries(data.arguments).map(([argName, argDef], index) => (
              <div key={argName} className="node-field-input">
                {index > 0 && <Separator />}
                <InputFieldComponent
                  fieldData={argDef}
                  path={[...path, "arguments", argName]}
                />
              </div>
            ))}
          </div>
          {/* Handle both single and multiple outputs */}
          <div>
            {Object.entries(data.outputs).map(
              ([outputName, outputDef], index) => (
                <div key={outputName} className="node-field-output">
                  {index > 0 && <Separator />}
                  <OutputFieldComponent
                    fieldData={outputDef}
                    path={[...path, "outputs", outputName]}
                  />
                </div>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
});
