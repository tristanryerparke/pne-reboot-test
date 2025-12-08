import { memo } from "react";
import SingleLineTextDisplay from "./single-line-text-display";
import { formatTypeForDisplay } from "@/utils/type-formatting";
import type { FrontendFieldDataWrapper, StructDescr } from "@/types/types";

interface ListDisplayProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function ListDisplay({ inputData }: ListDisplayProps) {
  const listType = inputData.type as StructDescr;
  const value = inputData.value as unknown[] | null;

  // If there's no value, show the "attach" message
  if (value === null || value === undefined) {
    const itemType = listType.itemsType;
    return (
      <SingleLineTextDisplay
        dimmed
        // content={`list[${formatTypeForDisplay(itemType)}]`}
        content={"no data"}
      />
    );
  }

  // If there's a value, display it
  const displayValue = Array.isArray(value)
    ? `[${value.join(", ")}]`
    : JSON.stringify(value);

  return <SingleLineTextDisplay content={displayValue} dimmed />;
});
