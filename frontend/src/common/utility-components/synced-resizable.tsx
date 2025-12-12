import { useRef, useState, useEffect, type ReactNode } from "react";
import { Resizable } from "re-resizable";
import { Grip } from "lucide-react";
import { useNodeData } from "@/stores/flowStore";
import useFlowStore from "@/stores/flowStore";
import { cn } from "@/lib/utils";

const CustomHandle = () => (
  <div className="bg-transparent rounded-sm h-full w-full p-0 flex items-center justify-center opacity-30 transition-opacity duration-200 hover:opacity-60">
    <Grip className="h-3 w-3 text-gray-500" />
  </div>
);

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

  // Track if this specific component is resizing
  const [amIResizing, setAmIResizing] = useState(false);

  // Check who is currently resizing in this node
  const whoIsResizing = useNodeData([path[0], "_whoIsResizing"]) as
    | string
    | undefined;
  const myPathKey = path.join(".");
  const isSomeoneElseResizing = Boolean(
    whoIsResizing && whoIsResizing !== myPathKey,
  );

  // Get stored height using useNodeData
  const storedSize = useNodeData([...path, "_expandedSize"]) as
    | { width: number; height: number }
    | undefined;
  const storedHeight = storedSize?.height || defaultSize.height;
  let storedWidth: string | number;
  if (amIResizing) {
    storedWidth = "auto";
  } else if (isSomeoneElseResizing || !storedSize) {
    // Use 100% when someone else is resizing OR on first render (no stored size yet)
    storedWidth = "100%";
  } else {
    storedWidth = storedSize?.width || defaultSize.width;
  }

  const resizableRef = useRef<Resizable>(null);

  // On first render, measure the actual width at 100% and store it
  useEffect(() => {
    if (storedSize || !resizableRef.current) return;

    const element = resizableRef.current.resizable;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateNodeData(
          [...path, "_expandedSize"],
          { width: Math.round(width), height: Math.round(height) },
          { suppress: true },
        );
        // Disconnect after first measurement
        resizeObserver.disconnect();
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [storedSize, path, updateNodeData]);

  // Track the latest observed size
  const latestObservedSize = useRef<{ width: number; height: number } | null>(
    null,
  );

  // Use ResizeObserver to track actual rendered size when someone else is resizing
  useEffect(() => {
    if (!resizableRef.current || amIResizing) return;

    const element = resizableRef.current.resizable;
    if (!element) return;

    // Only observe when someone else is resizing (width is "100%")
    if (!isSomeoneElseResizing) return;

    // console.log(`[${myPathKey}] Starting ResizeObserver`);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // contentRect gives us the actual content dimensions
        const { width, height } = entry.contentRect;
        // console.log(
        //   `[${myPathKey}] ResizeObserver: width = ${width}, height = ${height}`,
        // );

        // Store in ref for later use
        latestObservedSize.current = {
          width: Math.round(width),
          height: Math.round(height),
        };
      }
    });

    resizeObserver.observe(element);

    return () => {
      // console.log(`[${myPathKey}] Stopping ResizeObserver`);
      resizeObserver.disconnect();
    };
  }, [isSomeoneElseResizing, amIResizing, myPathKey]);

  // Watch for falling edge when someone else stops resizing
  const prevWhoIsResizingRef = useRef(whoIsResizing);
  useEffect(() => {
    const prevWhoIsResizing = prevWhoIsResizingRef.current;
    const currentWhoIsResizing = whoIsResizing;

    // Check if someone else (not me) was resizing before
    const wasSomeoneElseResizing =
      prevWhoIsResizing && prevWhoIsResizing !== myPathKey;
    // Check if someone else (not me) is resizing now
    const isSomeoneElseResizingNow =
      currentWhoIsResizing && currentWhoIsResizing !== myPathKey;

    // Detect falling edge: someone else was resizing, but now they stopped
    if (wasSomeoneElseResizing && !isSomeoneElseResizingNow) {
      console.log(`[${myPathKey}] Watcher: Someone else stopped resizing`);

      if (latestObservedSize.current) {
        console.log(
          `[${myPathKey}] Watcher: Using observed size =`,
          latestObservedSize.current,
        );

        updateNodeData([...path, "_expandedSize"], latestObservedSize.current, {
          prefix: "(synced-resizable-watcher)",
        });

        // Clear the observed size
        latestObservedSize.current = null;
      }
    }

    // Update the ref for next comparison
    prevWhoIsResizingRef.current = whoIsResizing;
  }, [whoIsResizing, myPathKey, path, updateNodeData]);

  function handleResizeStart(): void {
    // Set this component as the one resizing
    setAmIResizing(true);
    updateNodeData([path[0], "_whoIsResizing"], myPathKey, {
      suppress: true,
    });
  }

  function handleResizeStop(): void {
    // Clear the resizing flag and store the final size
    if (resizableRef.current) {
      const element = resizableRef.current.resizable;
      if (element) {
        const computedWidth = element.offsetWidth;
        const computedHeight = element.offsetHeight;
        updateNodeData(
          [...path, "_expandedSize"],
          { width: computedWidth, height: computedHeight },
          {
            prefix: "(synced-resizable)",
          },
        );
      }
    }
    setAmIResizing(false);
    updateNodeData([path[0], "_whoIsResizing"], undefined, {
      suppress: true,
    });
  }

  return (
    <Resizable
      ref={resizableRef}
      size={{ width: storedWidth, height: storedHeight }}
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
      className={cn("nodrag nowheel overflow-auto", className)}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
    >
      {children}
    </Resizable>
  );
}
