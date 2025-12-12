import { memo, useRef } from "react";
import NodeHeader from "./node-header";
import Inputs from "./inputs/inputs";
import Outputs from "./outputs/outputs";
import NodeDrawer from "./node-drawer";
import { Separator } from "../ui/separator";
import type { FunctionSchema } from "../../types/types";
import InspectableFieldWrapper from "../inspector-sidebar/inspectable-field-wrapper";
import { useNodeData } from "@/stores/flowStore";

export default memo(function CustomNode({
  data,
  id,
}: {
  data: FunctionSchema;
  id: string;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const path = [id];

  // Subscribe to _resizing to trigger re-renders when resizing occurs
  // This ensures the parent node recalculates its w-fit size during drag
  useNodeData([id, "_resizing"]);

  return (
    <div ref={nodeRef} className="w-fit">
      <div className="shadow-md border border-input rounded-lg bg-background text-secondary-foreground">
        <InspectableFieldWrapper path={path}>
          <div>
            <NodeHeader data={data} nodeId={id} />
          </div>
        </InspectableFieldWrapper>
        <Separator />
        <Inputs arguments={data.arguments} path={[...path, "arguments"]} />
        <Separator />
        <Outputs data={data} path={path} />
      </div>
      <div className="px-2 overflow-hidden nowheel">
        <NodeDrawer
          isExpanded={(data._drawerExpanded as true) || false}
          terminalOutput={data.terminal_output as string}
          path={path}
        />
      </div>
    </div>
  );
});
