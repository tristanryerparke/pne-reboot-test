import { memo } from "react";
import { Textarea } from "../components/ui/textarea";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../hooks/useControlledDebounce";

interface MultilineStringInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

export default memo(function MultilineStringInput({
  inputData,
  path,
}: MultilineStringInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Use current value if it exists, otherwise use default_value, otherwise empty string
  const externalValue =
    typeof inputData.value === "string"
      ? inputData.value
      : inputData?.default_value !== undefined
        ? inputData.default_value
        : "";

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

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <Textarea
      value={value}
      onChange={handleValueChange}
      onBlur={(e) => setValue(e.target.value)}
      disabled={isConnected}
      className="nodrag nopan nowheel w-full min-w-5 max-w-full wrap-break-word"
      placeholder="Enter text"
      rows={3}
      style={{
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        fieldSizing: "fixed",
      }}
    />
  );
});
