/**
 * Initializes selectedType for all union type arguments in node data.
 * This should be called when creating a new node (e.g., on drop).
 */
export function initializeUnionTypes(nodeData: any): void {
  if (!nodeData.arguments) return;

  Object.keys(nodeData.arguments).forEach((argName) => {
    const arg = nodeData.arguments[argName];
    if (typeof arg.type === "object" && arg.type?.anyOf && !arg.selectedType) {
      arg.selectedType = arg.type.anyOf[0];
    }
  });
}
