import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import type { FrontendFieldDataWrapper, StructDescr } from "@/types/types";

interface DictDisplayProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function DictDisplay({ inputData }: DictDisplayProps) {
  const dictType = inputData.type as StructDescr;
  const value = inputData.value as Record<string, unknown> | null;

  // If there's no value, show the "attach" message
  if (value === null || value === undefined) {
    const itemType = dictType.itemsType;
    return (
      <SingleLineTextDisplay
        dimmed
        // content={`dict[str, ${formatTypeForDisplay(itemType)}]`}
        content={"no data"}
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
