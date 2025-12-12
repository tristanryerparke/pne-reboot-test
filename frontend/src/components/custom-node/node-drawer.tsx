import { memo } from "react";
import SyncedResizable from "@/common/utility-components/synced-resizable";

type NodeDrawerProps = {
  isExpanded: boolean;
  terminalOutput?: string;
  path: (string | number)[];
};

const DEFAULT_AND_MIN_SIZE = {
  width: 300,
  height: 100,
};

const MAX_SIZE = {
  width: 800,
  height: 500,
};

export default memo(function NodeDrawer({
  isExpanded,
  terminalOutput,
  path,
}: NodeDrawerProps) {
  console.log("NodeDrawer:", {
    isExpanded,
    hasTerminalOutput: !!terminalOutput,
    path,
  });

  if (!isExpanded || !terminalOutput) {
    return null;
  }

  return (
    <SyncedResizable
      path={[...path, "terminal_drawer"]}
      defaultSize={DEFAULT_AND_MIN_SIZE}
      minSize={DEFAULT_AND_MIN_SIZE}
      maxSize={MAX_SIZE}
      className="bg-card border-x border-b border-input rounded-b-md shadow-lg overflow-hidden"
    >
      <div className="px-2 pt-2 pb-0 h-full w-full overflow-auto">
        <div className="font-mono text-xs whitespace-pre-wrap break-words">
          {terminalOutput}
        </div>
      </div>
    </SyncedResizable>
  );
});
