import { memo } from "react";
import SyncedResizable from "@/common/utility-components/synced-resizable";

type ErrorDetails = {
  error_type: string;
  error_message: string;
  traceback: string;
};

type NodeDrawerProps = {
  isExpanded: boolean;
  errorDetails?: ErrorDetails;
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
  errorDetails,
  path,
}: NodeDrawerProps) {
  if (!isExpanded || !errorDetails) {
    return null;
  }

  return (
    <SyncedResizable
      path={[...path, "error_drawer"]}
      defaultSize={DEFAULT_AND_MIN_SIZE}
      minSize={DEFAULT_AND_MIN_SIZE}
      maxSize={MAX_SIZE}
      useDefaultWidthOnFirstRender={true}
      className="bg-background border-x border-b border-input rounded-b-md shadow-lg"
    >
      <div className="p-3 h-full w-full overflow-auto">
        <div className="font-mono text-xs whitespace-pre-wrap wrap-break-word">
          {errorDetails.traceback}
        </div>
      </div>
    </SyncedResizable>
  );
});
