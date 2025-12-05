import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";

interface ImageOutputProps {
  outputData: any;
}

export default memo(function ImageOutput({ outputData }: ImageOutputProps) {
  // Check if image data exists directly on outputData or in value
  const hasDirectData = outputData?.cacheKey;
  const hasValueData = outputData?.value?.cache_ref;

  if (!hasDirectData && !hasValueData) {
    return <SingleLineTextDisplay content="No image" dimmed={true} />;
  }

  return <SingleLineTextDisplay content="Generated Image" dimmed={false} />;
});
