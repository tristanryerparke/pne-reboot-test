import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";

interface ImageOutputProps {
  outputData: any;
}

export default memo(function ImageOutput({ outputData }: ImageOutputProps) {
  const imageData = outputData?.value;

  if (!imageData || !imageData.cache_ref) {
    return <SingleLineTextDisplay content="No image" dimmed={true} />;
  }

  return (
    <div className="flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1 items-center">
      <span className="text-sm truncate">
        {imageData.width} × {imageData.height}
      </span>
    </div>
  );
});
