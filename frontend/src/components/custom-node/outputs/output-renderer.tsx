import { memo } from "react";
import SingleLineTextDisplay from "../../../common/single-line-text-display";
import useTypesStore from "@/stores/typesStore";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "./output-type-registry";
import type { OutputRendererProps } from "./output-type-registry";

export default memo(function OutputRenderer({
  outputData,
  path,
}: OutputRendererProps) {
  const types = useTypesStore((state) => state.types);

  // Check if there's a custom component for this type
  const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[outputData?.type];
  if (registryEntry) {
    // Handle new pattern with main/expanded
    if (typeof registryEntry === "object" && "main" in registryEntry) {
      const Component = registryEntry.main;
      return <Component outputData={outputData} path={path} />;
    } else {
      // Legacy direct component reference
      const Component = registryEntry;
      return <Component outputData={outputData} path={path} />;
    }
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
