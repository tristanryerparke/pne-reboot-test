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

interface SingleInputFieldProps {
  fieldData: any;
  path: (string | number)[];
  showMenu?: boolean;
  onDelete?: () => void;
  isEditableKey?: boolean;
  onKeyChange?: (newKey: string) => void;
}

export default function SingleInputField({
  fieldData,
  path,
  showMenu = false,
  onDelete,
  isEditableKey = false,
  onKeyChange,
}: SingleInputFieldProps) {
  const fieldName = path[2];
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

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

  const displayType = isUnionType
    ? fieldData.type.anyOf.join(" | ")
    : fieldData.type;

  // Handler for when user changes the type
  const handleTypeChange = (newType: string) => {
    updateNodeData([...path, "selectedType"], newType);
  };

  // Show menu if explicitly requested OR if it's a union type
  const shouldShowMenu = showMenu || isUnionType;

  return (
    <div className="relative w-full flex items-center">
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
            <div className="flex w-full pl-3 py-2 gap-1 overflow-hidden items-center">
              <div className="flex w-full items-center flex-shrink-0 gap-2">
                {isEditableKey ? (
                  <Editable
                    value={String(fieldName)}
                    onSubmit={onKeyChange}
                    placeholder="key"
                    autosize
                    className="gap-0 flex-shrink-0"
                  >
                    <EditableArea className="inline-block w-auto min-w-0 flex-shrink-0 edit:pr-5">
                      <EditablePreview className="border-0 px-0 py-0 focus-visible:ring-0 text-base md:text-sm whitespace-nowrap" />
                      <EditableInput className="px-1 py-0 min-w-[3ch]" />
                    </EditableArea>
                  </Editable>
                ) : (
                  <span>{fieldName}</span>
                )}
                <span>: </span>
                <InputRenderer inputData={fieldData} path={path} />
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
        <InputMenu
          onDelete={onDelete}
          unionTypes={unionTypes}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
        />
      )}
    </div>
  );
}
