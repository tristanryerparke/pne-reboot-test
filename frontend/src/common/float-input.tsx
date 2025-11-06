import { NumberInput } from "../components/ui/number-input";
import useStore from "../store";
import { useNodeConnections } from "@xyflow/react";
import { useDebounceValue } from "usehooks-ts";

interface FloatInputProps {
  inputData: any;
  path: (string | number)[];
}

export default function FloatInput({ inputData, path }: FloatInputProps) {
  // Get the field definition and current value from the store using selectors

  const currentValue = inputData.value;
  const updateNodeData = useStore((state) => state.updateNodeData);

  // Use current value if it exists, otherwise use default_value, otherwise undefined
  const initialValue =
    typeof currentValue === "number"
      ? currentValue
      : inputData?.default_value !== undefined
        ? inputData.default_value
        : undefined;

  const [debouncedValue, setValue] = useDebounceValue<number | undefined>(
    initialValue,
    200,
  );
  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const handleValueChange = (newValue: number | undefined) => {
    setValue(newValue);
    updateNodeData([...path, "value"], newValue);
    // Store update now happens via debounced effect
  };

  return (
    <NumberInput
      value={debouncedValue}
      decimalScale={3}
      onValueChange={handleValueChange}
      onBlur={() => handleValueChange(debouncedValue)}
      disabled={isConnected}
      className="nodrag nopan noscroll h-9 w-full"
      placeholder="Enter float"
    />
  );
}
