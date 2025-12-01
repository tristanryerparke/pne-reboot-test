import { memo, useState } from "react";
import { Resizable } from "re-resizable";
import { Textarea } from "../components/ui/textarea";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../hooks/useControlledDebounce";
import { CustomHandle } from "./expanded-constants";
import type { DataWrapper } from "@/types/types";

interface StringExpandedProps {
  inputData?: DataWrapper;
  outputData?: DataWrapper;
  path: (string | number)[];
  readOnly?: boolean;
}

interface Size {
  width: number;
  height: number;
}

const DEFAULT_AND_MIN_SIZE: Size = {
  width: 260,
  height: 80,
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

  const [currentSize, setCurrentSize] = useState<Size>(DEFAULT_AND_MIN_SIZE);

  return (
    <div className="w-full">
      <Resizable
        size={currentSize}
        minHeight={DEFAULT_AND_MIN_SIZE.height}
        minWidth={DEFAULT_AND_MIN_SIZE.width}
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
        onResizeStop={(_e, _direction, _ref, d) => {
          setCurrentSize({
            width: currentSize.width + d.width,
            height: currentSize.height + d.height,
          });
        }}
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
      </Resizable>
    </div>
  );
});
