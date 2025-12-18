import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "@/common/utility-components/resizable-height";
import { SyncedWidthHandle } from "@/common/utility-components/synced-width-resizable";
import useFlowStore, { useNodeData } from "@/stores/flowStore";
import { Grip } from "lucide-react";

type NodeDrawerProps = {
  isExpanded: boolean;
  terminalOutput?: string;
  path: (string | number)[];
  selected?: boolean;
};

const DEFAULT_AND_MIN_HEIGHT = 25; // Tailwind units
const MAX_HEIGHT = 125; // Tailwind units

export default memo(function NodeDrawer({
  isExpanded,
  terminalOutput,
  path,
  selected,
}: NodeDrawerProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // console.log("NodeDrawer:", {
  //   isExpanded,
  //   hasTerminalOutput: !!terminalOutput,
  //   path,
  // });

  // Get height from store
  const storedHeight = useNodeData([
    ...path,
    "_terminal_drawer",
    "_expandedHeight",
  ]) as number | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    updateNodeData([...path, "_terminal_drawer", "_expandedHeight"], newHeight);
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
      <div className={`nodrag nopan nowheel bg-card border-x border-b border-input rounded-b-md shadow-lg overflow-hidden h-full relative w-full ${selected ? "outline outline-[0.75px] outline-primary outline-offset-0" : ""}`}>
        <div
          className="px-2 pt-2 pb-0 h-full overflow-auto select-text cursor-text w-full"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="font-mono text-xs whitespace-pre-wrap break-all select-text w-full">
            {terminalOutput}
          </div>
        </div>
        <ResizableHeightHandle>
          <SyncedWidthHandle>
            <div className="nodrag shrink-0 cursor-nwse-resize absolute bottom-0 right-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity">
              <Grip className="h-3 w-3 text-muted-foreground" />
            </div>
          </SyncedWidthHandle>
        </ResizableHeightHandle>
      </div>
    </ResizableHeight>
  );
});
