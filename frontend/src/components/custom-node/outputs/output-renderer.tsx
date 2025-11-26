import { memo } from "react";
import SingleLineTextDisplay from "../../../common/single-line-text-display";
import useTypesStore from "@/stores/typesStore";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "./type-registry";

interface OutputRendererProps {
  outputData: any;
}

export default memo(function OutputRenderer({
  outputData,
}: OutputRendererProps) {
  const types = useTypesStore((state) => state.types);

  // Check if there's a custom component for this type
  const CustomComponent = OUTPUT_TYPE_COMPONENT_REGISTRY[outputData?.type];
  if (CustomComponent) {
    return <CustomComponent outputData={outputData} />;
  }

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
        // Handle dicts (plain objects) without quotes on keys
        if (!Array.isArray(outputData.value) && outputData.value !== null) {
          const entries = Object.entries(outputData.value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          return `{${entries}}`;
        }
        // Handle arrays
        if (Array.isArray(outputData.value)) {
          return `[${outputData.value.join(", ")}]`;
        }
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
