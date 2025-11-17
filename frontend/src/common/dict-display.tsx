import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";
import { formatTypeForDisplay } from "@/utils/type-formatting";

interface DictDisplayProps {
  inputData: any;
  path: (string | number)[];
}

export default memo(function DictDisplay({ inputData }: DictDisplayProps) {
  const dictType = inputData.type;
  const value = inputData.value;

  // If there's no value, show the "attach" message
  if (value === null || value === undefined) {
    const itemType = typeof dictType === "object" ? dictType.items : "unknown";
    return (
      <SingleLineTextDisplay
        dimmed
        content={`attach dict[str, ${formatTypeForDisplay(itemType)}]...`}
      />
    );
  }

  // If there's a value, display it
  const displayValue =
    typeof value === "object" && !Array.isArray(value)
      ? `{${Object.entries(value)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")}}`
      : JSON.stringify(value);

  return <SingleLineTextDisplay content={displayValue} dimmed />;
});
