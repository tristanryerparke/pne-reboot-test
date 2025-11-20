import { memo } from "react";
import StringInput from "../../../common/string-input";
import MultilineStringInput from "../../../common/multiline-string-input";
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

  // Special handling for string type with input mode
  if (actualType === "str") {
    const inputMode = inputData.inputMode || "single-line";
    const StringComponent =
      inputMode === "multiline" ? MultilineStringInput : StringInput;
    return (
      <StringComponent
        inputData={{ ...inputData, type: actualType }}
        path={path}
      />
    );
  }

  // Check if we have a specific component for this type
  const Component = TYPE_COMPONENT_REGISTRY[actualType];
  if (Component) {
    return (
      <Component inputData={{ ...inputData, type: actualType }} path={path} />
    );
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
