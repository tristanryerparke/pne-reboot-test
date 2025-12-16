import { memo } from "react";
import {
  ResizableHeight,
  ResizableHeightHandle,
} from "../../utility-components/resizable-height";
import { SyncedWidthHandle } from "../../utility-components/synced-width-resizable";
import type { FrontendFieldDataWrapper } from "@/types/types";
import useFlowStore, { useNodeData } from "@/stores/flowStore";

interface ImageExpandedProps {
  inputData?: FrontendFieldDataWrapper;
  outputData?: FrontendFieldDataWrapper;
  path: (string | number)[];
}

const DEFAULT_AND_MIN_HEIGHT = 60; // Tailwind units
const MAX_HEIGHT = 200; // Tailwind units

export default memo(function ImageExpanded({
  inputData,
  outputData,
  path,
}: ImageExpandedProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Get height from store
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;
  const height = storedHeight || DEFAULT_AND_MIN_HEIGHT;

  const setHeight = (newHeight: number) => {
    updateNodeData([...path, "_expandedHeight"], newHeight);
  };

  // Support both inputData and outputData
  const data = inputData || outputData;
  if (!data) {
    return <div>No data</div>;
  }

  // Image data is stored directly on the data object (from image-input.tsx)
  // Check if data has the image properties directly or in value
  const imageValue = (
    (data as any)._preview
      ? data
      : (data.value as {
          cacheKey?: string;
          _width?: number;
          _height?: number;
          _mode?: string;
          _preview?: string;
          _displayName?: string;
          _filename?: string;
        } | null)
  ) as {
    cacheKey?: string;
    _width?: number;
    _height?: number;
    _mode?: string;
    _preview?: string;
    _displayName?: string;
    _filename?: string;
  } | null;

  const hasImage = !!imageValue?._preview;

  return (
    <div className="flex flex-col flex-1">
      <ResizableHeight
        height={height}
        setHeight={setHeight}
        minHeight={DEFAULT_AND_MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        useTailwindScale={true}
      >
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input overflow-hidden relative">
          {hasImage ? (
            <img
              src={`data:image/webp;base64,${imageValue._preview}`}
              alt="Preview"
              className="w-full h-full object-contain"
              draggable={false}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <span className="text-sm text-muted-foreground">No image</span>
          )}
          <ResizableHeightHandle>
            <SyncedWidthHandle>
              <div className="bg-red-600 h-2 w-2 shrink-0 cursor-nwse-resize absolute bottom-0 right-0" />
            </SyncedWidthHandle>
          </ResizableHeightHandle>
        </div>
      </ResizableHeight>
      {hasImage && imageValue._filename && (
        <p className="text-xs text-muted-foreground mt-1">
          {imageValue._filename}
        </p>
      )}
    </div>
  );
});
