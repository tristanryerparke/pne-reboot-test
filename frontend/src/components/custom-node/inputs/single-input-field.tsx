import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import InputRenderer from "./input-renderer";
import InputMenu from "./input-menu";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import { TYPE_COMPONENT_REGISTRY } from "./type-registry";
import EditableKey from "./dynamic/editable-key";

interface SingleInputFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldData: any;
  path: (string | number)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeData: any;
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
  const isListInput = /^\d+$/.test(argName);
  const isDynamicListInput =
    isListInput && nodeData.dynamic_input_type?.structure_type === "list";

  // Detect if this is a dynamic dict input
  const isDynamicDictInput =
    fieldData._isDictInput === true &&
    nodeData.dynamic_input_type?.structure_type === "dict";

  if (!fieldData) {
    return <div>No field data</div>;
  }

  // Handle union types for display
  const isUnionType =
    typeof fieldData.type === "object" && fieldData.type?.anyOf;
  const unionTypes = isUnionType ? fieldData.type.anyOf : undefined;

  // Get the selected type from fieldData
  const selectedType =
    fieldData.selectedType || (unionTypes ? unionTypes[0] : undefined);

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

  // Show menu if it's the highest list input OR dict input OR union type OR has component options
  const shouldShowMenu =
    isHighestListInput ||
    isDynamicDictInput ||
    isUnionType ||
    hasComponentOptions;

  // Dict inputs have editable keys
  const isEditableKey = isDynamicDictInput;

  return (
    <div className="relative w-full flex items-center pr-1">
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
            <div className="flex w-full pl-3 pr py-2 gap-1 overflow-hidden items-center">
              <div className="flex min-w-0 items-center gap-2 flex-1">
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
                <div className="min-w-0 flex-1 mr-1">
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
  );
}
