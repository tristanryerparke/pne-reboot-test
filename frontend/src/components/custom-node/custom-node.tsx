import { memo, useRef } from "react";
import NodeHeader from "./node-header";
import Inputs from "./inputs/inputs";
import Outputs from "./outputs/outputs";
import { Separator } from "../ui/separator";
import type { FunctionSchema } from "../../types/types";
import InspectableFieldWrapper from "../inspector-sidebar/inspectable-field-wrapper";

export default memo(function CustomNode({
  data,
  id,
}: {
  data: FunctionSchema;
  id: string;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const path = [id];

  return (
    <div
      ref={nodeRef}
      className="w-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground"
    >
      <InspectableFieldWrapper path={path}>
        <div>
          <NodeHeader data={data} />
        </div>
      </InspectableFieldWrapper>
      <Separator />
      <Inputs arguments={data.arguments} path={[...path, "arguments"]} />
      <Separator />
      <Outputs data={data} path={path} />
    </div>
  );
});
