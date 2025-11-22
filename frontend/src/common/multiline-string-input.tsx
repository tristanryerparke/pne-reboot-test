import { memo } from "react";
import { Resizable } from "re-resizable";
import { Grip } from "lucide-react";
import { Textarea } from "../components/ui/textarea";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../hooks/useControlledDebounce";

interface MultilineStringInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

const CustomHandle = () => (
  <div className="bg-transparent rounded-sm h-full w-full p-0 flex items-center justify-center opacity-30 transition-opacity duration-200 hover:opacity-60">
    <Grip className="h-3 w-3 text-gray-500" />
  </div>
);

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
    <Resizable
      defaultSize={{
        width: 180,
        height: 80,
      }}
      minHeight={60}
      minWidth={180}
      maxHeight={400}
      maxWidth={600}
      enable={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false,
      }}
      handleComponent={{
        bottomRight: <CustomHandle />,
      }}
      handleStyles={{
        bottomRight: {
          bottom: "4px",
          right: "4px",
          width: "16px",
          height: "16px",
        },
      }}
      className="nodrag"
    >
      <Textarea
        value={value}
        onChange={handleValueChange}
        onBlur={(e) => setValue(e.target.value)}
        disabled={isConnected}
        className="nopan nowheel h-full w-full min-w-20 resize-none"
        placeholder="Enter text"
        style={{
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      />
    </Resizable>
  );
});
