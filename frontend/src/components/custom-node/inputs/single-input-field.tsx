import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import InputRenderer from "./input-renderer";
import InputMenu from "./input-menu";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import { TYPE_COMPONENT_REGISTRY } from "./type-registry";
import EditableKey from "./dynamic/editable-key";
import { Resizable } from "re-resizable";
import { Grip } from "lucide-react";
import type {
  FrontendFieldDataWrapper,
  FunctionSchema,
  ImageData,
  BaseDataTypes,
} from "../../../types/types";

// Types that have expandable preview areas
const TYPES_WITH_PREVIEW = ["CachedImage"];

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

interface SingleInputFieldProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
  nodeData: FunctionSchema;
}

export default function SingleInputField({
  fieldData,
  path,
  nodeData,
}: SingleInputFieldProps) {
  const fieldName = path[2];
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

  // Detect if this is a dynamic list input
  const argName = String(fieldName);
  const isDynamicListInput =
    fieldData._structuredInputType === "list" &&
    nodeData.dynamicInputType?.structureType === "list";

  // Detect if this is a dynamic dict input
  const isDynamicDictInput =
    fieldData._structuredInputType === "dict" &&
    nodeData.dynamicInputType?.structureType === "dict";

  if (!fieldData) {
    return <div>No field data</div>;
  }

  // Handle union types for display
  const isUnionType =
    typeof fieldData.type === "object" && "anyOf" in fieldData.type;
  const unionTypes =
    isUnionType &&
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type
      ? fieldData.type.anyOf
      : undefined;

  // Get the selected type from fieldData
  const selectedType =
    fieldData._selectedType || (unionTypes ? unionTypes[0] : undefined);

  const displayType = formatTypeForDisplay(fieldData.type);

  // Check if this type has multiple input component options in the registry
  const effectiveType = selectedType || fieldData.type;
  const registryEntry =
    typeof effectiveType === "string"
      ? TYPE_COMPONENT_REGISTRY[effectiveType]
      : undefined;
  const hasComponentOptions =
    registryEntry &&
    typeof registryEntry === "object" &&
    "anyOf" in registryEntry &&
    registryEntry.anyOf.length > 1;

  // Calculate if this is the highest numbered list input for deletion purposes
  const numberedArgs = Object.keys(nodeData.arguments || {})
    .filter((name) => /^\d+$/.test(name))
    .map((name) => parseInt(name));
  const maxListInputNumber =
    numberedArgs.length > 0 ? Math.max(...numberedArgs) : -1;
  const isHighestListInput =
    isDynamicListInput && parseInt(argName) === maxListInputNumber;

  // Check if this type has a preview area
  const hasPreview =
    typeof effectiveType === "string" &&
    TYPES_WITH_PREVIEW.includes(effectiveType);
  const showPreview = fieldData._showPreview ?? false;

  // Check if image data has been uploaded (for conditional menu display)
  const hasImageData = hasPreview && isImageData(fieldData.value);

  // Show menu if it's the highest list input OR dict input OR union type OR has component options OR has image data
  const shouldShowMenu =
    isHighestListInput ||
    isDynamicDictInput ||
    isUnionType ||
    hasComponentOptions ||
    hasImageData;

  // Dict inputs have editable keys
  const isEditableKey = isDynamicDictInput;

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
              <div className="flex w-full pl-3 pr py-2 gap-1 items-center">
                <div className="flex w-full items-center gap-2">
                  {/* Dynamic dict inputs have a user-editable key*/}
                  {isEditableKey ? (
                    <EditableKey
                      fieldName={fieldName}
                      path={path}
                      nodeData={nodeData}
                    />
                  ) : (
                    <span className="shrink-0">{fieldName}</span>
                  )}
                  <span className="shrink-0">: </span>
                  <div className="flex-1 mr-1">
                    <InputRenderer inputData={fieldData} path={path} />
                  </div>
                </div>
              </div>
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
        {shouldShowMenu && (
          <InputMenu path={path} nodeData={nodeData} fieldData={fieldData} />
        )}
      </div>
      {/* Expandable preview area for special types */}
      {hasPreview && showPreview && isImageData(fieldData.value) && (
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
