import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";
import { formatTypeForDisplay } from "@/utils/type-formatting";

interface ListDisplayProps {
  inputData: any;
  path: (string | number)[];
}

export default memo(function ListDisplay({ inputData }: ListDisplayProps) {
  const listType = inputData.type;
  const value = inputData.value;

  // If there's no value, show the "attach" message
  if (value === null || value === undefined) {
    const itemType = typeof listType === "object" ? listType.items : "unknown";
    return (
      <SingleLineTextDisplay
        dimmed
        content={`attach list[${formatTypeForDisplay(itemType)}]...`}
      />
    );
  }

  // If there's a value, display it
  const displayValue = Array.isArray(value)
    ? `[${value.join(", ")}]`
    : JSON.stringify(value);

  return <SingleLineTextDisplay content={displayValue} dimmed />;
});
