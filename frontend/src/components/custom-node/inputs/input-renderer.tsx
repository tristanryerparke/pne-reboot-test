import { memo } from "react";
import FloatInput from "../../../common/float-input";
import IntInput from "../../../common/int-input";
import StringInput from "../../../common/string-input";
import UserModelDisplay from "../../../common/user-model-display";
import useTypesStore from "@/stores/typesStore";
import ListDisplay from "@/common/list-display";
import DictDisplay from "@/common/dict-display";

interface InputRendererProps {
  inputData: any;
  path: (string | number)[];
}

// Add more input types here
export const TYPE_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<InputRendererProps>
> = {
  float: FloatInput,
  int: IntInput,
  str: StringInput,
};

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
