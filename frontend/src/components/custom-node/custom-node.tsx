import { memo, useState, useRef } from "react";
import NodeHeader from "./node-header";
import Inputs from "./inputs/inputs";
import Outputs from "./outputs/outputs";
import JsonViewer from "./json-viewer";
import { Separator } from "../ui/separator";

export default memo(function CustomNode({
  data,
  id,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  id: string;
}) {
  const [isJsonView, setIsJsonView] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const toggleView = () => setIsJsonView(!isJsonView);

  const path = [id];

  // console.log(data);

  return (
    <div
      ref={nodeRef}
      className="relative w-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground"
    >
      <NodeHeader
        data={data}
        isJsonView={isJsonView}
        onToggleView={toggleView}
      />
      <Separator />
      {isJsonView ? (
        <JsonViewer className="w-full" data={data} />
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
