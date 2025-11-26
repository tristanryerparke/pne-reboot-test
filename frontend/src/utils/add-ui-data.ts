import { TYPE_COMPONENT_REGISTRY } from "../components/custom-node/inputs/type-registry";

// Types that have expandable preview areas
const TYPES_WITH_PREVIEW = ["CachedImage"];

/**
 * Initializes UI-specific data for arguments and outputs:
 * - selectedType for union type arguments
 * - inputMode for types with multiple component options (e.g., str with single-line/multiline)
 * - showPreview for types with expandable preview areas (e.g., CachedImage)
 * This should be called when creating a new node (e.g., on drop).
 */
export function initializeUIData(nodeData: any): void {
  // Initialize arguments
  if (nodeData.arguments) {
    Object.keys(nodeData.arguments).forEach((argName) => {
      const arg = nodeData.arguments[argName];

      // Initialize selectedType for union types (from backend schema)
      if (
        typeof arg.type === "object" &&
        arg.type?.anyOf &&
        !arg.selectedType
      ) {
        arg.selectedType = arg.type.anyOf[0];
      }

      // Initialize inputMode for types with multiple component options (from frontend registry)
      const actualType = arg.selectedType || arg.type;
      if (typeof actualType === "string") {
        const registryEntry = TYPE_COMPONENT_REGISTRY[actualType];
        if (
          registryEntry &&
          typeof registryEntry === "object" &&
          "anyOf" in registryEntry
        ) {
          // This type has multiple component options
          if (arg.inputMode === undefined) {
            // Default to the first option (index 0)
            arg.inputMode = 0;
          }
        }

        // Initialize showPreview for types with expandable preview areas
        if (TYPES_WITH_PREVIEW.includes(actualType)) {
          if (arg.showPreview === undefined) {
            // Default to showing preview for cached types
            arg.showPreview = true;
          }
        }
      }
    });
  }

  // Initialize outputs
  if (nodeData.outputs) {
    Object.keys(nodeData.outputs).forEach((outputName) => {
      const output = nodeData.outputs[outputName];

      // Initialize showPreview for outputs with expandable preview areas
      const outputType = output.type;
      if (
        typeof outputType === "string" &&
        TYPES_WITH_PREVIEW.includes(outputType)
      ) {
        if (output.showPreview === undefined) {
          // Default to showing preview for cached types
          output.showPreview = true;
        }
      }
    });
  }
}
