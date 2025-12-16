import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

// Tailwind spacing scale: 1 unit = 0.25rem = 4px
const TAILWIND_UNIT = 4;

interface SyncedWidthHandleContextValue {
  parentWidth: number | null;
  setParentWidth: (width: number) => void;
  parentRef: React.RefObject<HTMLDivElement | null> | null;
  maxWidth?: number;
  useTailwindScale: boolean;
}

const SyncedWidthHandleContext = createContext<
  SyncedWidthHandleContextValue | undefined
>(undefined);

interface SyncedWidthHandleProviderProps {
  children: ReactNode;
  className?: string;
  maxWidth?: number;
  useTailwindScale?: boolean;
  width?: number | null;
  setWidth?: (width: number) => void;
}

export function SyncedWidthHandleProvider({
  children,
  className = "",
  maxWidth = Infinity,
  useTailwindScale = false,
  width: controlledWidth,
  setWidth: controlledSetWidth,
}: SyncedWidthHandleProviderProps) {
  const [internalWidth, setInternalWidth] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Use controlled width if provided, otherwise use internal state
  const parentWidth =
    controlledWidth !== undefined ? controlledWidth : internalWidth;
  const setParentWidth = controlledSetWidth || setInternalWidth;

  // Measure parent's natural width on first render
  useEffect(() => {
    if (parentWidth !== null || !parentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measuredWidth = entry.contentRect.width;
        const widthInUnits = useTailwindScale
          ? Math.round(measuredWidth / TAILWIND_UNIT)
          : measuredWidth;
        setParentWidth(widthInUnits);
        resizeObserver.disconnect();
      }
    });

    resizeObserver.observe(parentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [parentWidth, useTailwindScale]);

  return (
    <SyncedWidthHandleContext.Provider
      value={{
        parentWidth,
        setParentWidth,
        parentRef,
        maxWidth,
        useTailwindScale,
      }}
    >
      <div
        ref={parentRef}
        className={parentWidth === null ? `${className} w-fit` : className}
        style={
          parentWidth !== null
            ? {
                width: useTailwindScale
                  ? `${parentWidth * TAILWIND_UNIT}px`
                  : `${parentWidth}px`,
              }
            : undefined
        }
      >
        {children}
      </div>
    </SyncedWidthHandleContext.Provider>
  );
}

export function useSyncedWidthHandleContext() {
  const context = useContext(SyncedWidthHandleContext);
  if (!context) {
    throw new Error(
      "SyncedWidthHandle must be used within SyncedWidthHandleProvider",
    );
  }
  return context;
}

interface SyncedWidthHandleProps {
  children?: ReactNode;
  className?: string;
}

export function SyncedWidthHandle({
  children,
  className = "",
}: SyncedWidthHandleProps) {
  const { parentWidth, setParentWidth, parentRef, maxWidth, useTailwindScale } =
    useSyncedWidthHandleContext();
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const handleRef = useRef<HTMLDivElement>(null);
  const currentDragWidthRef = useRef(0);

  const disabled = parentWidth === null;

  // Convert to pixels if using Tailwind scale
  const maxWidthPx =
    useTailwindScale && maxWidth !== undefined && maxWidth !== Infinity
      ? maxWidth * TAILWIND_UNIT
      : maxWidth;
  const currentWidthPx =
    useTailwindScale && parentWidth !== null
      ? parentWidth * TAILWIND_UNIT
      : (parentWidth ?? 0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidthPx = startWidthRef.current + deltaX;
      const clampedWidthPx =
        maxWidthPx !== undefined
          ? Math.min(newWidthPx, maxWidthPx)
          : newWidthPx;

      const valueToReport = useTailwindScale
        ? clampedWidthPx / TAILWIND_UNIT
        : clampedWidthPx;

      currentDragWidthRef.current = valueToReport;

      // Update visual preview during drag
      if (parentRef?.current) {
        parentRef.current.style.width = `${clampedWidthPx}px`;
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

      // console.log(
      //   "[SyncedWidth] DRAG COMPLETE - NOW updating state:",
      //   currentDragWidthRef.current,
      // );
      setIsDragging(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "";

      // Update state with the final dragged value
      setParentWidth(currentDragWidthRef.current);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, maxWidthPx, setParentWidth, useTailwindScale, parentRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;

    // Don't stopPropagation - allow parent handlers (like ResizableHeightHandle) to also receive the event
    setIsDragging(true);

    startXRef.current = e.clientX;
    startWidthRef.current = currentWidthPx;
    // Initialize the drag ref with current width
    currentDragWidthRef.current = useTailwindScale
      ? (parentWidth ?? 0)
      : currentWidthPx;
    document.body.style.cursor = "ew-resize";
  };

  return (
    <div
      ref={handleRef}
      className={className}
      onMouseDown={handleMouseDown}
      style={{ cursor: disabled ? "default" : "ew-resize" }}
    >
      {children}
    </div>
  );
}
