import { memo } from "react";
import { NumberInput } from "../components/ui/number-input";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../hooks/useControlledDebounce";
import type { FieldDataWrapper } from "@/types/types";

interface IntInputProps {
  inputData: FieldDataWrapper;
  path: (string | number)[];
}

export default memo(function IntInput({ inputData, path }: IntInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Use current value if it exists, otherwise use default_value, otherwise undefined
  const externalValue =
    typeof inputData.value === "number" ? inputData.value : undefined;

  // Use controlled debounce - updates store only on user input, not external updates
  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      updateNodeData([...path, "value"], debouncedValue);
    },
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
    // Round to nearest integer for int inputs
    const intValue = newValue !== undefined ? Math.round(newValue) : undefined;
    setValue(intValue);
  };

  return (
    <NumberInput
      value={value}
      decimalScale={0}
      onValueChange={handleValueChange}
      onBlur={() => handleValueChange(value)}
      disabled={isConnected}
      className="nodrag nopan noscroll h-9 w-full min-w-20"
      placeholder="Enter integer"
    />
  );
});
