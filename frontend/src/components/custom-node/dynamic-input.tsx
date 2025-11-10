import { memo } from "react";
import FloatInput from "../../common/float-input";
import IntInput from "../../common/int-input";

interface DynamicInputProps {
  inputData: any;
  path: (string | number)[];
}

export default memo(function DynamicInput({
  inputData,
  path,
}: DynamicInputProps) {
  if (!inputData) {
    return <div>No data</div>;
  }

  // Always use the appropriate input component based on type
  if (inputData.type === "float") {
    return <FloatInput inputData={inputData} path={path} />;
  } else if (inputData.type === "int") {
    return <IntInput inputData={inputData} path={path} />;
  }

  // For types without a component, show a generic message
  console.log("No component for type:", inputData.type);
  return <div>DynamicInput: {inputData.type}</div>;
});
