import { memo } from "react";
import SingleLineTextDisplay from "../../common/single-line-text-display";

interface DynamicOutputProps {
  outputData: any;
}

export default memo(function DynamicOutput({ outputData }: DynamicOutputProps) {
  const displayValue = () => {
    if (outputData?.value !== undefined) {
      // Handle Point2D and other UserModel types
      if (
        outputData.type === "Point2D" &&
        typeof outputData.value === "object"
      ) {
        const fields = Object.entries(outputData.value)
          .map(([key, value]) => `${key}=${value}`)
          .join(", ");
        return `${outputData.type}(${fields})`;
      }

      // Handle different types of values
      if (typeof outputData.value === "object") {
        return JSON.stringify(outputData.value);
      }
      return String(outputData.value);
    }
    return "";
  };

  return (
    <SingleLineTextDisplay
      content={displayValue()}
      dimmed={!outputData?.value}
    />
  );
});
