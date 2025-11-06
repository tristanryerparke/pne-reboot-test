import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import DynamicOutput from "./dynamic_output";

interface OutputFieldComponentProps {
  fieldData: { type: string } | undefined;
  path: (string | number)[];
}

export default function OutputFieldComponent({
  fieldData,
  path,
}: OutputFieldComponentProps) {
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  // Extract the output name from the path (last element)
  const outputName = path[path.length - 1];

  if (!fieldData) {
    return <div>No field data</div>;
  }

  return (
    <div className="relative w-full">
      <Handle
        className="p-1 rounded-full bg-primary"
        type="source"
        position={Position.Right}
        id={handleId}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full pl-3 pr-2 py-2 gap-1 overflow-hidden items-center justify-end">
            <div className="w-full flex items-center flex-shrink-0 gap-2">
              <span>{outputName}:</span>
              <DynamicOutput outputData={fieldData} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={2}
          className="px-2 py-1 text-xs rounded-sm"
        >
          <span className="text-xs">{fieldData.type}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
