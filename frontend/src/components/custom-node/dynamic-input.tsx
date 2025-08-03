import FloatInput from "../../common/float-input";
import IntInput from "../../common/int-input";
import { getNodeData } from "../../utils/get-node-data";

interface DummyDynamicInputProps {
  path: (string | number)[];
  data?: {
    type: string;
  }
}

export default function DynamicInput({ path, data }: DummyDynamicInputProps) {
  // Use data prop if provided, otherwise get from store
  const fieldData = data || (getNodeData(path) as { type: string } | undefined);

  if (!fieldData) {
    return <div>No data</div>;
  }

  if (fieldData.type === 'float') {
    return <FloatInput path={path} />;
  }

  if (fieldData.type === 'int') {
    return <IntInput path={path} />;
  }

  return <div>DynamicInput: {fieldData.type}</div>;
}