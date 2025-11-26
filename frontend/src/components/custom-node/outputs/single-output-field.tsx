import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import OutputRenderer from "./output-renderer";
import OutputMenu from "./output-menu";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import { Resizable } from "re-resizable";
import { Grip } from "lucide-react";
import type { FieldDataWrapper } from "../../../types/types";

// Types that have expandable preview areas
const TYPES_WITH_PREVIEW = ["CachedImage"];

const CustomHandle = () => (
  <div className="bg-transparent rounded-sm h-full w-full p-0 flex items-center justify-center opacity-30 transition-opacity duration-200 hover:opacity-60">
    <Grip className="h-3 w-3 text-gray-500" />
  </div>
);

interface SingleOutputFieldProps {
  fieldData: FieldDataWrapper;
  path: (string | number)[];
}

export default function SingleOutputField({
  fieldData,
  path,
}: SingleOutputFieldProps) {
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  // Extract the output name from the path (last element)
  const outputName = path[path.length - 1];

  if (!fieldData) {
    return <div>No field data</div>;
  }

  // Check if this type has a preview area
  const effectiveType = fieldData.type;
  const hasPreview =
    typeof effectiveType === "string" &&
    TYPES_WITH_PREVIEW.includes(effectiveType);
  const showPreview = fieldData.showPreview ?? false;

  // Check if image data exists (for conditional menu display)
  const hasImageData = hasPreview && !!fieldData.value?.cache_ref;

  return (
    <div className="relative w-full">
      <div className="flex items-center pl-2">
        {hasImageData && <OutputMenu path={path} fieldData={fieldData} />}
        <div className="flex-1">
          <Handle
            className="p-1 rounded-full bg-primary"
            type="source"
            position={Position.Right}
            id={handleId}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full pl pr-3 py-2 gap-1 overflow-hidden items-center justify-end">
                <div className="w-full flex items-center shrink-0 gap-2">
                  <span>{outputName}:</span>
                  <OutputRenderer outputData={fieldData} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={2}
              className="px-2 py-1 text-xs rounded-sm"
            >
              <span className="text-xs">
                {formatTypeForDisplay(fieldData.type)}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Expandable preview area for special types */}
      {hasPreview && showPreview && fieldData.value && (
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
                  alt="Output preview"
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
