import { memo } from "react";
import FloatInput from "../../common/float-input";
import IntInput from "../../common/int-input";
import UserModelDisplay from "../../common/user-model-display";

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
  Point2D: UserModelDisplay,
};

export default memo(function DynamicInput({
  inputData,
  path,
}: DynamicInputProps) {
  if (!inputData) {
    return <div>No data</div>;
  }

  const Component = TYPE_COMPONENT_REGISTRY[inputData.type];
  if (Component) {
    return <Component inputData={inputData} path={path} />;
  }

  // For types without a component, show a generic message
  console.log("No component for type:", inputData.type);
  return <div>DynamicInput: {inputData.type}</div>;
});
