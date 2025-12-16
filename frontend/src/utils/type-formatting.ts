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
    if (type.structure_type === "list") {
      const itemsType = type.items_type || "unknown";
      return `list[${formatTypeForDisplay(itemsType)}]`;
    }
    // Handle dict types
    if (type.structure_type === "dict") {
      const itemsType = type.items_type || "unknown";
      return `dict[str, ${formatTypeForDisplay(itemsType)}]`;
    }
  }
  // Fallback for unknown types
  return String(type);
}
