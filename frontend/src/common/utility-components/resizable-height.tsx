import { useState, useRef, useEffect, createContext, useContext } from "react";

// Tailwind spacing scale: 1 unit = 0.25rem = 4px
const TAILWIND_UNIT = 4;

interface ResizableHeightContextType {
  handleMouseDown: (e: React.MouseEvent) => void;
}

const ResizableHeightContext = createContext<ResizableHeightContextType | null>(
  null,
);

interface ResizableHeightProps {
  children: React.ReactNode;
  height?: number;
  setHeight?: (height: number) => void;
  initialHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  useTailwindScale?: boolean;
}

export function ResizableHeight({
  children,
  height: controlledHeight,
  setHeight: controlledSetHeight,
  initialHeight = 40,
  minHeight = 20,
  maxHeight = Infinity,
  useTailwindScale = false,
}: ResizableHeightProps) {
  const [internalHeight, setInternalHeight] = useState(initialHeight);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const currentDragHeightRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if component is controlled
  const isControlled =
    controlledHeight !== undefined && controlledSetHeight !== undefined;
  const height = isControlled ? controlledHeight : internalHeight;
  const setHeight = isControlled ? controlledSetHeight : setInternalHeight;

  // Convert to pixels if using Tailwind scale
  const minHeightPx = useTailwindScale ? minHeight * TAILWIND_UNIT : minHeight;
  const maxHeightPx =
    useTailwindScale && maxHeight !== Infinity
      ? maxHeight * TAILWIND_UNIT
      : maxHeight;
  const currentHeightPx = useTailwindScale ? height * TAILWIND_UNIT : height;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = e.clientY - startYRef.current;
      const newHeightPx = startHeightRef.current + deltaY;
      const clampedHeightPx = Math.max(
        minHeightPx,
        Math.min(maxHeightPx, newHeightPx),
      );

      const valueToReport = useTailwindScale
        ? clampedHeightPx / TAILWIND_UNIT
        : clampedHeightPx;

      currentDragHeightRef.current = valueToReport;

      // Update visual preview during drag
      if (containerRef.current) {
        containerRef.current.style.height = `${clampedHeightPx}px`;
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;

      // console.log(
      //   "[ResizableHeight] DRAG COMPLETE - NOW updating state:",
      //   currentDragHeightRef.current,
      // );
      isDraggingRef.current = false;

      // Update state with the final dragged value
      setHeight(currentDragHeightRef.current);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minHeightPx, maxHeightPx, setHeight, useTailwindScale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = currentHeightPx;
    // Initialize the drag ref with current height
    currentDragHeightRef.current = useTailwindScale ? height : currentHeightPx;
  };

  return (
    <ResizableHeightContext.Provider value={{ handleMouseDown }}>
      <div
        ref={containerRef}
        style={{ height: `${currentHeightPx}px` }}
        className="relative"
      >
        {children}
      </div>
    </ResizableHeightContext.Provider>
  );
}

interface ResizableHeightHandleProps {
  children: React.ReactNode;
}

export function ResizableHeightHandle({
  children,
}: ResizableHeightHandleProps) {
  const context = useContext(ResizableHeightContext);
  if (!context) {
    throw new Error(
      "ResizableHeightHandle must be used within ResizableHeight",
    );
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    context.handleMouseDown(e);
    // Don't stop propagation - let SyncedHandle also handle the event
  };

  return <div onMouseDown={handleMouseDown}>{children}</div>;
}
