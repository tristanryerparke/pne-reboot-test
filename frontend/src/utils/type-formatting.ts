/**
 * Format a type definition for display in tooltips and UI
 * Handles simple types, union types, list types, and object types
 */
export function formatTypeForDisplay(type: any): string {
  if (typeof type === "string") {
    return type;
  }
  if (typeof type === "object") {
    // Handle union types (anyOf)
    if (type.anyOf) {
      return type.anyOf.map(formatTypeForDisplay).join(" | ");
    }
    // Handle list types
    if (type.structureType === "list") {
      const itemsType = type.itemsType || "unknown";
      return `list[${formatTypeForDisplay(itemsType)}]`;
    }
    // Handle dict types
    if (type.structureType === "dict") {
      const itemsType = type.itemsType || "unknown";
      return `dict[str, ${formatTypeForDisplay(itemsType)}]`;
    }
  }
  // Fallback for unknown types
  return String(type);
}
