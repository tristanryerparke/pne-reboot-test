import OutputRenderer from "./output-renderer";
import OutputMenu from "./output-menu";
import { OUTPUT_TYPE_COMPONENT_REGISTRY } from "./type-registry";
import type { FrontendFieldDataWrapper } from "../../../types/types";

interface OutputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function OutputDisplay({ fieldData, path }: OutputDisplayProps) {
  const fieldName = path[path.length - 1];

  // Handle union types - check if type is an object with anyOf
  let actualType = fieldData.type;
  if (
    typeof fieldData.type === "object" &&
    "anyOf" in fieldData.type &&
    fieldData.type.anyOf
  ) {
    actualType = fieldData._selectedType || fieldData.type.anyOf[0];
  }

  // Function to render the expanded component if it exists and is enabled
  const renderExpandedContent = () => {
    if (typeof actualType !== "string") {
      return null;
    }

    const registryEntry = OUTPUT_TYPE_COMPONENT_REGISTRY[actualType];
    if (!registryEntry || typeof registryEntry !== "object") {
      return null;
    }

    // Check if expanded component exists and is enabled
    const expandedComponent = registryEntry.expanded;
    const isExpanded = fieldData._expanded ?? false;

    if (!expandedComponent || !isExpanded) {
      return null;
    }

    const ExpandedComponent = expandedComponent;
    return (
      <div className="pr-0.5">
        <ExpandedComponent
          outputData={{ ...fieldData, type: actualType }}
          path={path}
          readOnly={true}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-1.5">
      <div className="flex w-full items-center gap-1 h-8">
        <span className="shrink-0">{fieldName}</span>
        <span className="shrink-0">:</span>
        <div className="flex-1">
          <OutputRenderer outputData={fieldData} path={path} />
        </div>
        <OutputMenu path={path} fieldData={fieldData} />
      </div>
      {renderExpandedContent()}
    </div>
  );
}
