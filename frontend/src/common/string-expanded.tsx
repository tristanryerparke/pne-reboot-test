import { memo } from "react";
import SyncedResizable from "./synced-resizable";
import { Textarea } from "../components/ui/textarea";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../hooks/useControlledDebounce";
import type { DataWrapper } from "@/types/types";

interface StringExpandedProps {
  inputData?: DataWrapper;
  outputData?: DataWrapper;
  path: (string | number)[];
  readOnly?: boolean;
}

const DEFAULT_AND_MIN_SIZE = {
  width: 260,
  height: 80,
};

const MAX_SIZE = {
  width: 600,
  height: 400,
};

export default memo(function StringExpanded({
  inputData,
  outputData,
  path,
  readOnly = false,
}: StringExpandedProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Support both inputData and outputData
  const data = inputData || outputData;
  if (!data) {
    return <div>No data</div>;
  }

  const externalValue = typeof data.value === "string" ? data.value : "";

  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      updateNodeData([...path, "value"], debouncedValue);
    },
    200,
  );

  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const isDisabled = readOnly || isConnected;

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <SyncedResizable
      path={path}
      defaultSize={DEFAULT_AND_MIN_SIZE}
      minSize={DEFAULT_AND_MIN_SIZE}
      maxSize={MAX_SIZE}
    >
      <Textarea
        value={value}
        onChange={handleValueChange}
        onBlur={(e) => setValue(e.target.value)}
        disabled={isDisabled}
        className={`nopan nowheel h-full w-full resize-none ${readOnly ? "cursor-default" : ""}`}
        placeholder="Enter text"
        style={{
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          opacity: readOnly ? 1 : undefined,
        }}
      />
    </SyncedResizable>
  );
});
