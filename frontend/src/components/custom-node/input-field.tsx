import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import DynamicInput from "./dynamic-input";

interface InputFieldProps {
  fieldData: any;
  path: (string | number)[];
}

export default function InputFieldComponent({
  fieldData,
  path,
}: InputFieldProps) {
  const fieldName = path[2];
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

  if (!fieldData) {
    return <div>No field data</div>;
  }

  return (
    <div className="relative w-full">
      <Handle
        // TODO: Why don't height and width work?
        className="p-1 rounded-full bg-primary"
        type="target"
        position={Position.Left}
        id={handleId}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full pl-3 py-2 gap-1 overflow-hidden items-center">
            <div className="flex w-full items-center flex-shrink-0 gap-2">
              <span>
                {fieldName}
                {": "}
              </span>
              <DynamicInput inputData={fieldData} path={path} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={2}
          className="px-2 py-1 text-xs rounded-sm"
        >
          <span className="text-xs">{fieldData.type}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
