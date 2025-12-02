import { memo, useRef, useMemo, type ReactNode } from "react";
import { Resizable } from "re-resizable";
import type { ResizeCallback } from "re-resizable";
import { CustomHandle } from "./expanded-constants";
import { useNodeData } from "@/stores/flowStore";
import useFlowStore from "@/stores/flowStore";

interface SyncedResizableProps {
  path: (string | number)[];
  children: ReactNode;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  className?: string;
}

export default memo(function SyncedResizable({
  path,
  children,
  defaultSize,
  minSize,
  maxSize,
  className = "",
}: SyncedResizableProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodeId = path[0];

  // Get the latest resized path and stored dimensions from the node data
  const latestResized = useNodeData([nodeId, "_latestResized"]) as
    | string
    | null;
  const storedWidth = useNodeData([...path, "_expandedWidth"]) as
    | number
    | undefined;
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;

  // Create a unique path string for this component
  const pathString = path.join(":");

  // Track if this component is the latest resized
  const isLatestResized = latestResized === pathString;

  // Calculate current size directly from store values
  // For width: use stored width only if this is the latest resized, otherwise use "100%"
  // For height: always use stored height or default
  const currentSize = useMemo(() => {
    if (isLatestResized) {
      return {
        width: storedWidth || defaultSize.width,
        height: storedHeight || defaultSize.height,
      };
    }
    // Non-active components use full width of parent
    return {
      width: "100%",
      height: storedHeight || defaultSize.height,
    };
  }, [
    isLatestResized,
    storedWidth,
    storedHeight,
    defaultSize.width,
    defaultSize.height,
  ]);

  const resizableRef = useRef<Resizable>(null);
  const isResizingRef = useRef(false);

  const handleResizeStart = () => {
    isResizingRef.current = true;
    // Mark this component as the latest resized
    updateNodeData([nodeId, "_latestResized"], pathString);
  };

  const handleResizeStop: ResizeCallback = (_e, _direction, ref) => {
    isResizingRef.current = false;

    // Get the actual pixel dimensions from the resized element
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;

    // Store the new dimensions in the store
    updateNodeData([...path, "_expandedWidth"], newWidth);
    updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  return (
    <div className="w-full">
      <Resizable
        ref={resizableRef}
        size={currentSize}
        minHeight={minSize.height}
        minWidth={minSize.width}
        maxHeight={maxSize.height}
        maxWidth={maxSize.width}
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
        className={`nodrag ${className}`}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
      >
        {children}
      </Resizable>
    </div>
  );
});
