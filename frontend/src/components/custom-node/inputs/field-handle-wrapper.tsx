import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import InputDisplay from "./input-display";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import { Resizable } from "re-resizable";
import { Grip } from "lucide-react";
import type {
  FrontendFieldDataWrapper,
  ImageData,
  BaseDataTypes,
} from "../../../types/types";

// Type guard for ImageData
function isImageData(value: BaseDataTypes | null): value is ImageData {
  return (
    value !== null &&
    typeof value === "object" &&
    "cache_ref" in value &&
    "thumb_base64" in value
  );
}

const CustomHandle = () => (
  <div className="bg-transparent rounded-sm h-full w-full p-0 flex items-center justify-center opacity-30 transition-opacity duration-200 hover:opacity-60">
    <Grip className="h-3 w-3 text-gray-500" />
  </div>
);

interface NodeInputFieldProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function NodeInputField({
  fieldData,
  path,
}: NodeInputFieldProps) {
  const handleId = `${path.join(":")}:handle`;

  if (!fieldData) {
    return <div>No field data</div>;
  }

  const displayType = formatTypeForDisplay(fieldData.type);

  // Check if this type has a preview area and is currently being shown
  const showPreview = fieldData._showPreview ?? false;
  const hasPreview = showPreview && isImageData(fieldData.value);

  return (
    <div className="relative w-full">
      <div className="flex items-center pr-1">
        <div className="flex-1">
          <Handle
            // TODO: Why don't height and width work?
            className="p-1 rounded-full bg-primary"
            type="target"
            position={Position.Left}
            id={handleId}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <InputDisplay fieldData={fieldData} path={path} />
            </TooltipTrigger>
            <TooltipContent
              side="left"
              sideOffset={2}
              className="px-2 py-1 text-xs rounded-sm"
            >
              <span className="text-xs">{displayType}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Expandable preview area for special types */}
      {hasPreview && (
        <div className="px-3 pb-2">
          {fieldData.value.thumb_base64 && (
            <div className="flex flex-col gap-1">
              <Resizable
                defaultSize={{
                  width: 280,
                  height: 280,
                }}
                minHeight={280}
                minWidth={280}
                maxHeight={600}
                maxWidth={600}
                lockAspectRatio={false}
                enable={{
                  top: false,
                  right: false,
                  bottom: false,
                  left: false,
                  topRight: false,
                  bottomRight: true,
                  bottomLeft: false,
                  topLeft: false,
                }}
                handleComponent={{
                  bottomRight: <CustomHandle />,
                }}
                handleStyles={{
                  bottomRight: {
                    bottom: "0px",
                    right: "0px",
                    width: "16px",
                    height: "16px",
                  },
                }}
                className="nodrag rounded border border-input flex items-center justify-center bg-transparent"
              >
                <img
                  src={`data:image/png;base64,${fieldData.value.thumb_base64}`}
                  alt="Input preview"
                  className="max-w-full max-h-full object-contain rounded"
                />
              </Resizable>
              <div className="text-xs text-muted-foreground">
                {fieldData.value.width} × {fieldData.value.height} (
                {fieldData.value.mode})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
