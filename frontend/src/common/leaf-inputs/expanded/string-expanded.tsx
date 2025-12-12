import { memo } from "react";
import SyncedResizable from "../../utility-components/synced-resizable";
import { Textarea } from "../../../components/ui/textarea";
import useFlowStore from "../../../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { useControlledDebounce } from "../../../hooks/useControlledDebounce";
import type { DataWrapper } from "@/types/types";
import { cn } from "@/lib/utils";

interface StringExpandedProps {
  inputData?: DataWrapper;
  outputData?: DataWrapper;
  path: (string | number)[];
  readOnly?: boolean;
}

const DEFAULT_AND_MIN_SIZE = {
  width: 240,
  height: 120,
};

const MAX_SIZE = {
  width: 800,
  height: 800,
};

export default memo(function StringExpanded({
  inputData,
  outputData,
  path,
  readOnly = false,
}: StringExpandedProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Call all hooks before any early returns
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Support both inputData and outputData
  const data = inputData || outputData;

  const externalValue = typeof data?.value === "string" ? data.value : "";

  const [value, setValue] = useControlledDebounce(
    externalValue,
    (debouncedValue) => {
      updateNodeData([...path, "value"], debouncedValue);
    },
    200,
  );

  // Early return after all hooks
  if (!data) {
    return <div>No data</div>;
  }

  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const isDisabled = readOnly || isConnected;

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  return (
    <div className="flex flex-col">
      <SyncedResizable
        path={path}
        defaultSize={DEFAULT_AND_MIN_SIZE}
        minSize={DEFAULT_AND_MIN_SIZE}
        maxSize={MAX_SIZE}
      >
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input overflow-hidden">
          <Textarea
            value={value}
            onChange={handleValueChange}
            onBlur={(e) => setValue(e.target.value)}
            disabled={isDisabled}
            className={cn(
              "nopan nowheel border-none",
              "w-full h-full",
              readOnly && "cursor-default",
            )}
            placeholder=""
            style={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              opacity: readOnly ? 1 : undefined,
              resize: "none",
              fieldSizing: "fixed",
            }}
          />
        </div>
      </SyncedResizable>
    </div>
  );
});
