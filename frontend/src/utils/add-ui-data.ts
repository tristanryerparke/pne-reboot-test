import { TYPE_COMPONENT_REGISTRY } from "../components/custom-node/inputs/type-registry";

/**
 * Initializes UI-specific data for arguments and outputs:
 * - _selectedType for union type arguments
 * - _expanded for types with expandable areas (e.g., Image, str)
 * This should be called when creating a new node (e.g., on drop).
 */
export function initializeUIData(nodeData: any): void {
  // Initialize arguments
  if (nodeData.arguments) {
    Object.keys(nodeData.arguments).forEach((argName) => {
      const arg = nodeData.arguments[argName];

      // Initialize _selectedType for union types (from backend schema)
      if (
        typeof arg.type === "object" &&
        arg.type?.anyOf &&
        !arg._selectedType
      ) {
        arg._selectedType = arg.type.anyOf[0];
      }

      // Initialize _expanded for types based on registry
      const actualType = arg._selectedType || arg.type;
      if (typeof actualType === "string") {
        const registryEntry = TYPE_COMPONENT_REGISTRY[actualType];
        if (registryEntry && typeof registryEntry === "object") {
          // Initialize _expanded for types with expandable areas
          if (registryEntry.expanded) {
            if (arg._expanded === undefined) {
              // Default to collapsed (false)
              arg._expanded = false;
            }
          }
        }
      }
    });
  }

  // Initialize outputs
  if (nodeData.outputs) {
    Object.keys(nodeData.outputs).forEach((outputName) => {
      const output = nodeData.outputs[outputName];

      // Initialize _expanded for outputs with expandable areas
      const outputType = output.type;
      if (typeof outputType === "string") {
        const registryEntry = TYPE_COMPONENT_REGISTRY[outputType];
        if (
          registryEntry &&
          typeof registryEntry === "object" &&
          registryEntry.expanded
        ) {
          if (output._expanded === undefined) {
            // Default to collapsed (false)
            output._expanded = false;
          }
        }
      }
    });
  }
}
