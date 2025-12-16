import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "@/common/utility-components/resizable-height";
import { SyncedWidthHandle } from "@/common/utility-components/synced-width-resizable";
import useFlowStore, { useNodeData } from "@/stores/flowStore";

type NodeDrawerProps = {
  isExpanded: boolean;
  terminalOutput?: string;
  path: (string | number)[];
};

const DEFAULT_AND_MIN_HEIGHT = 25; // Tailwind units
const MAX_HEIGHT = 125; // Tailwind units

export default memo(function NodeDrawer({
  isExpanded,
  terminalOutput,
  path,
}: NodeDrawerProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  console.log("NodeDrawer:", {
    isExpanded,
    hasTerminalOutput: !!terminalOutput,
    path,
  });

  // Get height from store
  const storedHeight = useNodeData([
    ...path,
    "terminal_drawer",
    "_expandedHeight",
  ]) as number | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    updateNodeData([...path, "terminal_drawer", "_expandedHeight"], newHeight);
  };

  if (!isExpanded || !terminalOutput) {
    return null;
  }

  return (
    <ResizableHeight
      height={height}
      setHeight={setHeight}
      minHeight={DEFAULT_AND_MIN_HEIGHT}
      maxHeight={MAX_HEIGHT}
      useTailwindScale={true}
    >
      <div className="bg-card border-x border-b border-input rounded-b-md shadow-lg overflow-hidden h-full relative">
        <div
          className="px-2 pt-2 pb-0 h-full overflow-auto select-text cursor-text"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="font-mono text-xs whitespace-pre-wrap break-word select-text">
            {terminalOutput}
          </div>
        </div>
        <ResizableHeightHandle>
          <SyncedWidthHandle>
            <div className="bg-red-600 h-2 w-2 shrink-0 cursor-nwse-resize absolute bottom-0 right-0" />
          </SyncedWidthHandle>
        </ResizableHeightHandle>
      </div>
    </ResizableHeight>
  );
});
