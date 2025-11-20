import { memo } from "react";
import UserModelDisplay from "../../../common/user-model-display";
import useTypesStore from "@/stores/typesStore";
import ListDisplay from "@/common/list-display";
import DictDisplay from "@/common/dict-display";
import { TYPE_COMPONENT_REGISTRY } from "./type-registry";

interface InputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

export default memo(function InputRenderer({
  inputData,
  path,
}: InputRendererProps) {
  const types = useTypesStore((state) => state.types);

  if (!inputData) {
    return <div>No data</div>;
  }

  // Handle union types - check if type is an object with anyOf
  let actualType = inputData.type;
  if (typeof inputData.type === "object" && inputData.type?.anyOf) {
    // For union types, use selectedType if available, otherwise default to first type
    actualType = inputData.selectedType || inputData.type.anyOf[0];
  }

  // Handle user_alias types - treat them like union types
  if (typeof inputData.type === "string") {
    const typeInfo = types[inputData.type];
    if (
      typeInfo &&
      typeInfo.kind === "user_alias" &&
      typeof typeInfo.type === "object" &&
      typeInfo.type?.anyOf
    ) {
      // For user aliases, use selectedType if available, otherwise default to first type in the alias
      actualType = inputData.selectedType || typeInfo.type.anyOf[0];
    }
  }

  // Check if we have a specific component for this type
  const registryEntry = TYPE_COMPONENT_REGISTRY[actualType];
  if (registryEntry) {
    // Handle registry entries with multiple component options (anyOf)
    if (typeof registryEntry === "object" && "anyOf" in registryEntry) {
      const components = registryEntry.anyOf;
      // Use inputMode index to select component (defaults to 0)
      const componentIndex = inputData.inputMode ?? 0;
      const Component = components[componentIndex] || components[0];
      return (
        <Component inputData={{ ...inputData, type: actualType }} path={path} />
      );
    } else {
      // Single component case
      const Component = registryEntry;
      return (
        <Component inputData={{ ...inputData, type: actualType }} path={path} />
      );
    }
  }

  // Check if this type exists in the store and is a user_model
  const typeInfo = types[actualType];
  if (typeInfo && typeInfo.kind === "user_model") {
    return (
      <UserModelDisplay
        inputData={{ ...inputData, type: actualType }}
        path={path}
        typeInfo={typeInfo}
      />
    );
  }

  // Handle complex types like object and list
  if (typeof actualType === "object" && actualType.structure_type) {
    if (actualType.structure_type === "list") {
      return (
        <ListDisplay
          inputData={{ ...inputData, type: actualType }}
          path={path}
        />
      );
    }
    if (actualType.structure_type === "dict") {
      return (
        <DictDisplay
          inputData={{ ...inputData, type: actualType }}
          path={path}
        />
      );
    }
  }

  // For types without a component, show a generic message
  console.log("No component for type:", actualType);
  return <div>InputRenderer: {JSON.stringify(inputData)}</div>;
});
