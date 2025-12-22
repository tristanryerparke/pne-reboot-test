import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";

interface ImageOutputProps {
  outputData: any;
}

export default memo(function ImageOutput({ outputData }: ImageOutputProps) {
  const cacheKey =
    typeof outputData?.value === "string" &&
    outputData.value.startsWith("$cacheKey:")
      ? outputData.value.slice("$cacheKey:".length)
      : undefined;

  if (!cacheKey) {
    return <SingleLineTextDisplay content="No image" dimmed={true} />;
  }

  const displayName = (outputData as any).displayName || "Generated Image";

  return <SingleLineTextDisplay content={displayName} dimmed={false} />;
});
