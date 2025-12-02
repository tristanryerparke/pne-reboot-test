import { memo, useMemo } from "react";
import type { CSSProperties } from "react";
import SyncedResizable from "./synced-resizable";
import { useNodeData } from "@/stores/flowStore";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface ImageExpandedProps {
  inputData?: FrontendFieldDataWrapper;
  outputData?: FrontendFieldDataWrapper;
  path: (string | number)[];
}

const DEFAULT_AND_MIN_SIZE = {
  width: 270,
  height: 270,
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

  // Get current size from the synced resizable component
  const storedWidth = useNodeData([...path, "_expandedWidth"]) as
    | number
    | undefined;
  const storedHeight = useNodeData([...path, "_expandedHeight"]) as
    | number
    | undefined;

  const currentSize = {
    width: storedWidth || DEFAULT_AND_MIN_SIZE.width,
    height: storedHeight || DEFAULT_AND_MIN_SIZE.height,
  };

  // Calculate image style to maintain aspect ratio within container
  const imageStyle = useMemo((): CSSProperties | undefined => {
    if (!imageValue?._width || !imageValue?._height) return undefined;

    const containerRatio = currentSize.width / currentSize.height;
    const imageRatio = imageValue._width / imageValue._height;

    return {
      aspectRatio: `${imageValue._width} / ${imageValue._height}`,
      width:
        containerRatio < imageRatio
          ? `min(${imageValue._width}px, 100%)`
          : undefined,
      height:
        containerRatio < imageRatio
          ? undefined
          : `min(${imageValue._height}px, 100%)`,
      objectFit: "contain",
    };
  }, [currentSize, imageValue?._width, imageValue?._height]);

  const hasImage = !!imageValue?._preview;

  return (
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
            style={imageStyle}
            className="max-w-full max-h-full"
            draggable={false}
          />
        ) : (
          <span className="text-sm text-muted-foreground">No image</span>
        )}
      </div>
      {hasImage && imageValue._width && imageValue._height && (
        <p className="text-xs text-muted-foreground mt-1">
          {imageValue._width} × {imageValue._height} ({imageValue._mode})
        </p>
      )}
    </SyncedResizable>
  );
});
