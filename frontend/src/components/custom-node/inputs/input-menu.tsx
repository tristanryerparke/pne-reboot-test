import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import useFlowStore from "../../../stores/flowStore";
import { TYPE_COMPONENT_REGISTRY } from "./type-registry";

interface InputMenuProps {
  path?: (string | number)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldData: any;
}

export default function InputMenu({
  path,
  nodeData,
  fieldData,
}: InputMenuProps) {
  const deleteNodeData = useFlowStore((state) => state.deleteNodeData);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const getNodeData = useFlowStore((state) => state.getNodeData);

  // Handle union types - detect from fieldData
  const isUnionType =
    typeof fieldData.type === "object" && fieldData.type?.anyOf;
  const unionTypes = isUnionType ? fieldData.type.anyOf : undefined;
  const selectedType =
    fieldData.selectedType || (unionTypes ? unionTypes[0] : undefined);
  const hasUnionTypes = unionTypes && unionTypes.length > 1;

  // Handle component options from registry (e.g., single-line vs multiline for strings)
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
  const selectedInputMode = fieldData.inputMode ?? 0;

  // Detect if this is a dynamic list input
  const argName = path ? String(path[path.length - 1]) : "";
  const isListInput = /^\d+$/.test(argName);
  const isDynamicListInput =
    isListInput && nodeData.dynamic_input_type?.structure_type === "list";

  // Detect if this is a dynamic dict input
  const isDynamicDictInput =
    fieldData._isDictInput === true &&
    nodeData.dynamic_input_type?.structure_type === "dict";

  // Calculate if this is the highest numbered list input for deletion purposes
  const numberedArgs = Object.keys(nodeData.arguments || {})
    .filter((name) => /^\d+$/.test(name))
    .map((name) => parseInt(name));
  const maxListInputNumber =
    numberedArgs.length > 0 ? Math.max(...numberedArgs) : -1;
  const isHighestListInput =
    isDynamicListInput && parseInt(argName) === maxListInputNumber;

  // Show delete button if it's a dynamically created input
  // For list inputs, only show for the highest numbered input
  // For dict inputs, show for all dict inputs
  const showDeleteButton = isHighestListInput || isDynamicDictInput;

  const handleTypeChange = (newType: string) => {
    if (path) {
      updateNodeData([...path, "selectedType"], newType);
    }
  };

  const handleInputModeChange = (newModeStr: string) => {
    if (path) {
      const newMode = parseInt(newModeStr);
      updateNodeData([...path, "inputMode"], newMode);
    }
  };

  const handleDelete = () => {
    if (!path) return;

    if (isDynamicListInput) {
      // For list inputs, only allow deleting the highest numbered input
      const argName = String(path[path.length - 1]);
      const argumentsPath = [...path.slice(0, -1)];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argumentsData = getNodeData(argumentsPath) as Record<string, any>;

      if (!argumentsData) return;

      const argNames = Object.keys(argumentsData);
      const argNumbers = argNames
        .filter((name) => /^\d+$/.test(name))
        .map((name) => parseInt(name));

      const maxNumber = Math.max(...argNumbers);
      const currentNumber = parseInt(argName);

      // Only allow deleting the highest numbered input
      if (currentNumber !== maxNumber) {
        console.warn(
          `Can only delete the highest numbered input (${maxNumber})`,
        );
        return;
      }

      // Simple deletion - no renumbering needed
      deleteNodeData(path);
    } else {
      // For dict inputs and other cases, simple deletion
      deleteNodeData(path);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="right" sideOffset={5}>
        {hasUnionTypes && (
          <>
            <DropdownMenuLabel>Input Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selectedType}
              onValueChange={handleTypeChange}
            >
              {unionTypes.map((type: string) => (
                <DropdownMenuRadioItem key={type} value={type}>
                  {type}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {(hasComponentOptions || showDeleteButton) && (
              <DropdownMenuSeparator />
            )}
          </>
        )}
        {hasComponentOptions && (
          <>
            <DropdownMenuLabel>Input Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={String(selectedInputMode)}
              onValueChange={handleInputModeChange}
            >
              {registryEntry &&
                "anyOf" in registryEntry &&
                registryEntry.anyOf.map((_, index) => (
                  <DropdownMenuRadioItem key={index} value={String(index)}>
                    {index === 0 ? "Single-line" : "Multiline"}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
            {showDeleteButton && <DropdownMenuSeparator />}
          </>
        )}
        {showDeleteButton && (
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
