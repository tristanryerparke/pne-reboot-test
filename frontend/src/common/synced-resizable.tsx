import { useRef, useCallback, useMemo, type ReactNode } from "react";
import { Resizable } from "re-resizable";
import type { ResizeCallback } from "re-resizable";
import { CustomHandle } from "./expanded-constants";
import useFlowStore from "@/stores/flowStore";

interface SyncedResizableProps {
  path: (string | number)[];
  children: ReactNode;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  className?: string;
}

export default function SyncedResizable({
  path,
  children,
  defaultSize,
  minSize,
  maxSize,
  className = "",
}: SyncedResizableProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const nodeId = path[0];

  // Memoized selector for shared width - only re-renders when this specific value changes
  const sharedWidth = useFlowStore(
    useCallback(
      (state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        return (
          (node?.data._expandedComponentWidth as number | undefined) ||
          defaultSize.width
        );
      },
      [nodeId, defaultSize.width],
    ),
  );

  // Memoized path for stored size lookup
  const sizePath = useMemo(() => [...path, "_expandedSize"], [path]);

  // Memoized selector for component height
  const componentHeight = useFlowStore(
    useCallback(
      (state) => {
        const node = state.nodes.find((n) => n.id === path[0]);
        if (!node) return defaultSize.height;

        let current = node.data;
        const pathToProperty = sizePath.slice(1);

        for (let i = 0; i < pathToProperty.length; i++) {
          if (current?.[pathToProperty[i]] === undefined) {
            return defaultSize.height;
          }
          current = current[pathToProperty[i]];
        }

        return (
          (current as { width: number; height: number } | undefined)?.height ||
          defaultSize.height
        );
      },
      [path, sizePath, defaultSize.height],
    ),
  );

  const resizableRef = useRef<Resizable>(null);

  // All components use the shared width
  const currentSize = {
    width: sharedWidth,
    height: componentHeight,
  };

  const handleResize: ResizeCallback = (_e, _direction, _ref) => {
    const newWidth = _ref.offsetWidth;

    // Update the shared width at the node level (all components will see this)
    updateNodeData([nodeId, "_expandedComponentWidth"], newWidth, {
      suppress: true,
    });
  };

  const handleResizeStop: ResizeCallback = (_e, _direction, ref) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;

    // Store the final dimensions when resize is complete
    updateNodeData(
      [...path, "_expandedSize"],
      { width: newWidth, height: newHeight },
      { prefix: "component resize complete" },
    );
  };

  return (
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
      onResize={handleResize}
      onResizeStop={handleResizeStop}
    >
      {children}
    </Resizable>
  );
}
