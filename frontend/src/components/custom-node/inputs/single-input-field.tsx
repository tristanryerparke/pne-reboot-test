import { Handle, Position } from "@xyflow/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import InputRenderer from "./input-renderer";
import InputMenu from "./input-menu";
import useFlowStore from "../../../stores/flowStore";
import {
  Editable,
  EditableArea,
  EditablePreview,
  EditableInput,
} from "../../ui/editable";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import { useRef, useLayoutEffect, useState } from "react";

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
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const fieldName = path[2];
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const measureRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);

  // Detect if this is a dynamic list input
  const argName = String(fieldName);
  const isListInput = /^\d+$/.test(argName);
  const isDynamicListInput =
    isListInput && nodeData.dynamic_input_type?.structure_type === "list";

  // Detect if this is a dynamic dict input
  const isDynamicDictInput =
    fieldData._isDictInput === true &&
    nodeData.dynamic_input_type?.structure_type === "dict";

  useLayoutEffect(() => {
    if (measureRef.current) {
      // Measure the text width including padding and border, plus extra space for comfortable editing
      const width = measureRef.current.offsetWidth + 1; // Add 8px extra space
      setTextWidth(width);
    }
  }, [fieldName]);

  if (!fieldData) {
    return <div>No field data</div>;
  }

  // Handle union types for display
  const isUnionType =
    typeof fieldData.type === "object" && fieldData.type?.anyOf;
  const unionTypes = isUnionType ? fieldData.type.anyOf : undefined;

  // Get the selected type from fieldData (should be set by backend)
  const selectedType =
    fieldData.selectedType || (unionTypes ? unionTypes[0] : undefined);

  const displayType = formatTypeForDisplay(fieldData.type);

  // For string types (or when str is selected in a union), allow switching between single-line and multiline
  const effectiveType = selectedType || fieldData.type;
  const isStringType = effectiveType === "str";

  // Calculate if this is the highest numbered list input for deletion purposes
  const numberedArgs = Object.keys(nodeData.arguments || {})
    .filter((name) => /^\d+$/.test(name))
    .map((name) => parseInt(name));
  const maxListInputNumber =
    numberedArgs.length > 0 ? Math.max(...numberedArgs) : -1;
  const isHighestListInput =
    isDynamicListInput && parseInt(argName) === maxListInputNumber;

  // Show menu if it's the highest list input OR dict input OR union type OR string type
  const shouldShowMenu =
    isHighestListInput || isDynamicDictInput || isUnionType || isStringType;

  // Dict inputs have editable keys
  const isEditableKey = isDynamicDictInput;

  // Handler for when user changes the key name (for dict inputs)
  const handleKeyChange = (newKey: string) => {
    if (!newKey || newKey === String(fieldName)) return;

    // Get the arguments path
    const argumentsPath = [...path.slice(0, -1)];
    const argumentsData = nodeData.arguments;

    if (argumentsData[newKey]) {
      console.warn(`Key "${newKey}" already exists`);
      return;
    }

    const newArguments = { ...argumentsData };
    newArguments[newKey] = newArguments[fieldName];
    delete newArguments[fieldName];

    updateNodeData(argumentsPath, newArguments);
  };

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
                {isEditableKey ? (
                  <>
                    <span
                      ref={measureRef}
                      className="invisible absolute border border-transparent px-1 py-0 shadow-xs text-base md:text-sm whitespace-nowrap"
                      aria-hidden="true"
                    >
                      {fieldName}
                    </span>
                    <Editable
                      value={String(fieldName)}
                      onSubmit={handleKeyChange}
                      placeholder="key"
                      className="gap-0 shrink-0"
                    >
                      <EditableArea
                        className="inline-block min-w-0 shrink-0"
                        style={
                          textWidth ? { width: `${textWidth}px` } : undefined
                        }
                      >
                        <EditablePreview className="border border-transparent px-1 py-0 shadow-xs focus-visible:ring-0 text-base md:text-sm whitespace-nowrap" />
                        <EditableInput className="border border-neutral-200 px-1 py-0 w-full" />
                      </EditableArea>
                    </Editable>
                  </>
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
