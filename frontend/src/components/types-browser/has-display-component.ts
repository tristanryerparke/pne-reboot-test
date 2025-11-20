import { TYPE_COMPONENT_REGISTRY } from "../custom-node/inputs/type-registry";
import type { TypeInfo } from "@/stores/typesStore";

export function hasDisplayComponent(
  typeName: string,
  types: Record<string, TypeInfo>,
  visited: Set<string> = new Set(),
): boolean {
  // Prevent infinite recursion
  if (visited.has(typeName)) {
    return false;
  }

  // Check if the type directly has a component
  if (typeName in TYPE_COMPONENT_REGISTRY) {
    return true;
  }

  // Check if it's a user_model with properties
  const typeInfo = types[typeName];
  if (typeInfo && typeInfo.kind === "user_model" && typeInfo.properties) {
    visited.add(typeName);

    // Check if all properties recursively have display components
    const propertyTypes = Object.values(typeInfo.properties);
    return propertyTypes.every((propType) =>
      hasDisplayComponent(propType as string, types, visited),
    );
  }

  return false;
}
