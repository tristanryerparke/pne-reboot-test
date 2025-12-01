import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";

interface StringOutputProps {
  outputData: any;
}

export default memo(function StringOutput({ outputData }: StringOutputProps) {
  // Check if expanded view is active
  const isExpanded = outputData?._expanded ?? false;

  // Render transparent div when expanded
  if (isExpanded) {
    return <div className="h-9 w-full min-w-20 bg-transparent" />;
  }

  return (
    <SingleLineTextDisplay
      content={outputData?.value ? String(outputData.value) : ""}
      dimmed={!outputData?.value}
    />
  );
});
