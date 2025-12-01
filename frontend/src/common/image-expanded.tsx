import { memo, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { Resizable } from "re-resizable";
import { CustomHandle } from "./expanded-constants";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface ImageExpandedProps {
  inputData?: FrontendFieldDataWrapper;
  outputData?: FrontendFieldDataWrapper;
  path: (string | number)[];
}

interface Size {
  width: number;
  height: number;
}

const DEFAULT_AND_MIN_SIZE: Size = {
  width: 260,
  height: 260,
};

export default memo(function ImageExpanded({
  inputData,
  outputData,
}: ImageExpandedProps) {
  // Support both inputData and outputData
  const data = inputData || outputData;
  if (!data) {
    return <div>No data</div>;
  }

  // Image data is stored directly on the data object (from image-input.tsx)
  // Check if data has the image properties directly or in value
  const imageValue = (data as any)._preview
    ? data
    : (data.value as {
        cacheKey?: string;
        _width?: number;
        _height?: number;
        _mode?: string;
        _preview?: string;
      } | null);

  const [currentSize, setCurrentSize] = useState<Size>(DEFAULT_AND_MIN_SIZE);

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
    <div className="w-full">
      <Resizable
        size={currentSize}
        minHeight={DEFAULT_AND_MIN_SIZE.height}
        minWidth={DEFAULT_AND_MIN_SIZE.width}
        maxHeight={800}
        maxWidth={800}
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
        className="nodrag"
        onResizeStop={(_e, _direction, _ref, d) => {
          setCurrentSize({
            width: currentSize.width + d.width,
            height: currentSize.height + d.height,
          });
        }}
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
      </Resizable>
      {hasImage && imageValue._width && imageValue._height && (
        <p className="text-xs text-muted-foreground mt-1">
          {imageValue._width} × {imageValue._height} ({imageValue._mode})
        </p>
      )}
    </div>
  );
});
