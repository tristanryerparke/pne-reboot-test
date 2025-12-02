import { memo } from "react";
import EditableKey from "./dynamic/editable-key";
import InputMenu from "./input-menu";
import { useNodeData } from "../../../stores/flowStore";
import useTypesStore from "@/stores/typesStore";
import ListDisplay from "@/common/list-display";
import DictDisplay from "@/common/dict-display";
import UserModelDisplay from "../../../common/user-model-display";
import { TYPE_COMPONENT_REGISTRY } from "./input-type-registry";
import type {
  FrontendFieldDataWrapper,
  StructDescr,
} from "../../../types/types";

interface InputFieldDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function InputFieldDisplay({
  fieldData,
  path,
}: InputFieldDisplayProps) {
  const types = useTypesStore((state) => state.types);
  const nodeId = path[0];
  const fieldName = path[path.length - 1];

  // Detect if this is a dynamic dict input as dict inputs have editable keys
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;
  const isDynamicDictInput =
    fieldData._structuredInputType === "dict" &&
    dynamicInputType?.structureType === "dict";
  const isEditableKey = isDynamicDictInput;

  if (!fieldData) {
    return <div>No data</div>;
  }

  // Handle union types - check if type is an object with anyOf
  let actualType = fieldData.type;
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    // For union types, use _selectedType if available, otherwise default to first type
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  // Function to render the main input component
  const renderMainInput = () => {
    // Check if we have a specific component for this type
    if (typeof actualType !== "string") {
      // actualType is StructDescr or UnionDescr, handle below
    } else {
      const registryEntry = TYPE_COMPONENT_REGISTRY[actualType];
      if (registryEntry) {
        // Handle registry entries with main/expanded pattern
        if (typeof registryEntry === "object" && "main" in registryEntry) {
          const Component = registryEntry.main;
          return (
            <Component
              inputData={{ ...fieldData, type: actualType }}
              path={path}
            />
          );
        } else if (
          typeof registryEntry === "object" &&
          "anyOf" in registryEntry
        ) {
          // Legacy anyOf pattern support
          const components = registryEntry.anyOf;
          const Component = components[0];
          return (
            <Component
              inputData={{ ...fieldData, type: actualType }}
              path={path}
            />
          );
        } else {
          // Direct component reference (legacy support)
          const Component = registryEntry;
          return (
            <Component
              inputData={{ ...fieldData, type: actualType }}
              path={path}
            />
          );
        }
      }
    }

    // Check if this type exists in the store and is a user_model
    if (typeof actualType === "string") {
      const typeInfo = types[actualType];
      if (typeInfo && typeInfo.kind === "user_model") {
        return (
          <UserModelDisplay
            inputData={{ ...fieldData, type: actualType }}
            path={path}
            typeInfo={typeInfo}
          />
        );
      }
    }

    // Handle complex types like object and list
    if (typeof actualType === "object" && "structureType" in actualType) {
      if (actualType.structureType === "list") {
        return (
          <ListDisplay
            inputData={{ ...fieldData, type: actualType }}
            path={path}
          />
        );
      }
      if (actualType.structureType === "dict") {
        return (
          <DictDisplay
            inputData={{ ...fieldData, type: actualType }}
            path={path}
          />
        );
      }
    }

    // For types without a component, show a generic message
    console.log("No component for type:", actualType);
    return <div>InputRenderer: {JSON.stringify(fieldData)}</div>;
  };

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (typeof actualType !== "string") {
      return null;
    }

    const registryEntry = TYPE_COMPONENT_REGISTRY[actualType];
    if (!registryEntry || typeof registryEntry !== "object") {
      return null;
    }

    // Check if expanded component exists and is enabled
    const expandedComponent = registryEntry.expanded;
    const isExpanded = fieldData._expanded ?? false;

    if (!expandedComponent || !isExpanded) {
      return null;
    }

    const ExpandedComponent = expandedComponent;
    return (
      <div className="pr-0.5 flex-1">
        <ExpandedComponent
          inputData={{ ...fieldData, type: actualType }}
          path={path}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 gap-1.5">
      <div className="flex flex-1 items-center gap-1 h-8">
        {isEditableKey ? (
          <EditableKey fieldName={fieldName} path={path} />
        ) : (
          <span className="shrink-0">{fieldName}</span>
        )}
        <span className="shrink-0">:</span>
        <div className="flex-1 min-w-0">{renderMainInput()}</div>
        <InputMenu path={path} fieldData={fieldData} />
      </div>
      {renderExpandedContent()}
    </div>
  );
});
