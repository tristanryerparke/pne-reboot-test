import { memo } from "react";

interface DynamicOutputProps {
  outputData: any;
}

export default memo(function DynamicOutput({ outputData }: DynamicOutputProps) {
  const displayValue = () => {
    if (outputData?.value !== undefined) {
      // Handle different types of values
      if (typeof outputData.value === "object") {
        return JSON.stringify(outputData.value);
      }
      return String(outputData.value);
    }
    return "";
  };

  return (
    <div className="flex h-9 w-full min-w-0 rounded-md border dark:bg-input/30 px-3 py-1 text-base shadow-xs border-input overflow-hidden items-center">
      <span className="text-sm text-muted-foreground truncate">
        {displayValue()}
      </span>
    </div>
  );
});
