import FloatInput from "../../common/float-input";
import IntInput from "../../common/int-input";
import { getNodeData } from "../../utils/get-node-data";

interface DynamicInputProps {
  path: (string | number)[];
}

export default function DynamicInput({ path }: DynamicInputProps) {
  // Use data prop if provided, otherwise get from store
  const fieldData = getNodeData(path) as { type: string } | undefined;
  
  if (!fieldData) {
    return <div>No data</div>;
  }

  // Always use the appropriate input component based on type
  if (fieldData.type === 'float') {
    return <FloatInput path={path} />;
  }

  if (fieldData.type === 'int') {
    return <IntInput path={path} />;
  }

  // For other types, show a generic message
  return <div>DynamicInput: {fieldData.type}</div>;
}