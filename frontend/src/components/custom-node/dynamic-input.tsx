import { memo } from "react";
import FloatInput from "../../common/float-input";
import IntInput from "../../common/int-input";
import UserModelDisplay from "../../common/user-model-display";
import useStore from "@/store";

interface DynamicInputProps {
  inputData: any;
  path: (string | number)[];
}

// Add more input types here
export const TYPE_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<DynamicInputProps>
> = {
  float: FloatInput,
  int: IntInput,
};

export default memo(function DynamicInput({
  inputData,
  path,
}: DynamicInputProps) {
  const types = useStore((state) => state.types);

  if (!inputData) {
    return <div>No data</div>;
  }

  // Check if we have a specific component for this type
  const Component = TYPE_COMPONENT_REGISTRY[inputData.type];
  if (Component) {
    return <Component inputData={inputData} path={path} />;
  }

  // Check if this type exists in the store and is a user_model
  const typeInfo = types[inputData.type];
  if (typeInfo && typeInfo.kind === "user_model") {
    return (
      <UserModelDisplay inputData={inputData} path={path} typeInfo={typeInfo} />
    );
  }

  // For types without a component, show a generic message
  console.log("No component for type:", inputData.type);
  return <div>DynamicInput: {inputData.type}</div>;
});
