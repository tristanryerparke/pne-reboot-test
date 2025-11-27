import InputRenderer from "./input-renderer";
import EditableKey from "./dynamic/editable-key";
import InputMenu from "./input-menu";
import { TYPE_COMPONENT_REGISTRY } from "./type-registry";
import { useNodeData } from "../../../stores/flowStore";
import type {
  FrontendFieldDataWrapper,
  StructDescr,
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

interface InputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function InputDisplay({ fieldData, path }: InputDisplayProps) {
  const nodeId = path[0];
  const fieldName = path[path.length - 1];

  // Get data from Zustand store
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;
  const arguments_ = useNodeData([nodeId, "arguments"]) as
    | Record<string, FrontendFieldDataWrapper>
    | undefined;

  // Detect if this is a dynamic list input
  const argName = String(fieldName);
  const isDynamicListInput =
    fieldData._structuredInputType === "list" &&
    dynamicInputType?.structureType === "list";

  // Detect if this is a dynamic dict input
  const isDynamicDictInput =
    fieldData._structuredInputType === "dict" &&
    dynamicInputType?.structureType === "dict";

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
  const numberedArgs = Object.keys(arguments_ || {})
    .filter((name) => /^\d+$/.test(name))
    .map((name) => parseInt(name));
  const maxListInputNumber =
    numberedArgs.length > 0 ? Math.max(...numberedArgs) : -1;
  const isHighestListInput =
    isDynamicListInput && parseInt(argName) === maxListInputNumber;

  // Check if this type has a preview area by looking for the 'preview' key
  const hasPreview = "preview" in fieldData;

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
    <div className="flex w-full pl-3 pr py-2 gap-1 items-center">
      <div className="flex w-full items-center gap-2">
        {/* Dynamic dict inputs have a user-editable key*/}
        {isEditableKey ? (
          <EditableKey fieldName={fieldName} path={path} />
        ) : (
          <span className="shrink-0">{fieldName}</span>
        )}
        <span className="shrink-0">: </span>
        <div className="flex-1 mr-1">
          <InputRenderer inputData={fieldData} path={path} />
        </div>
      </div>
      {shouldShowMenu && <InputMenu path={path} fieldData={fieldData} />}
    </div>
  );
}
