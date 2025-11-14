import { memo } from "react";
import SingleLineTextDisplay from "../../../common/single-line-text-display";
import useTypesStore from "@/stores/typesStore";

interface OutputRendererProps {
  outputData: any;
}

export default memo(function OutputRenderer({
  outputData,
}: OutputRendererProps) {
  const types = useTypesStore((state) => state.types);

  const displayValue = () => {
    if (outputData?.value !== undefined) {
      const typeInfo = types[outputData.type];

      // Handle user_model types generically
      if (
        typeInfo &&
        typeInfo.kind === "user_model" &&
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
