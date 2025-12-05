import { memo } from "react";
import SyncedResizable from "./synced-resizable";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface ImageExpandedProps {
  inputData?: FrontendFieldDataWrapper;
  outputData?: FrontendFieldDataWrapper;
  path: (string | number)[];
}

const DEFAULT_AND_MIN_SIZE = {
  width: 240,
  height: 240,
};

const MAX_SIZE = {
  width: 800,
  height: 800,
};

export default memo(function ImageExpanded({
  inputData,
  outputData,
  path,
}: ImageExpandedProps) {
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
        } | null)
  ) as {
    cacheKey?: string;
    _width?: number;
    _height?: number;
    _mode?: string;
    _preview?: string;
  } | null;

  const hasImage = !!imageValue?._preview;

  return (
    <div className="flex flex-col">
      <SyncedResizable
        path={path}
        defaultSize={DEFAULT_AND_MIN_SIZE}
        minSize={DEFAULT_AND_MIN_SIZE}
        maxSize={MAX_SIZE}
      >
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-md border border-input overflow-hidden">
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
        </div>
      </SyncedResizable>
      {hasImage && imageValue._width && imageValue._height && (
        <p className="text-xs text-muted-foreground mt-1">
          {imageValue._width} × {imageValue._height} ({imageValue._mode})
        </p>
      )}
    </div>
  );
});
