import { TYPE_COMPONENT_REGISTRY } from "../components/custom-node/inputs/type-registry";

/**
 * Initializes UI-specific data for arguments:
 * - selectedType for union type arguments
 * - inputMode for types with multiple component options (e.g., str with single-line/multiline)
 * This should be called when creating a new node (e.g., on drop).
 */
export function initializeUIData(nodeData: any): void {
  if (!nodeData.arguments) return;

  Object.keys(nodeData.arguments).forEach((argName) => {
    const arg = nodeData.arguments[argName];

    // Initialize selectedType for union types (from backend schema)
    if (typeof arg.type === "object" && arg.type?.anyOf && !arg.selectedType) {
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
    }
  });
}
