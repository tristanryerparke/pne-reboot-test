import { TYPE_COMPONENT_REGISTRY } from "../../custom-node/inputs/input-type-registry";
import type { TypeInfo, PropertyType } from "@/stores/typesStore";

function getPropertyTypeName(propType: PropertyType): string | null {
  if (typeof propType === "string") {
    return propType;
  }
  if ("anyOf" in propType) {
    return null;
  }
  if (
    "type" in propType &&
    propType.type === "list" &&
    "itemsType" in propType
  ) {
    return getPropertyTypeName(propType.itemsType);
  }
  return null;
}

export function hasDisplayComponent(
  typeName: string,
  types: Record<string, TypeInfo>,
  visited: Set<string> = new Set(),
): boolean {
  if (visited.has(typeName)) {
    return false;
  }

  if (typeName in TYPE_COMPONENT_REGISTRY) {
    return true;
  }

  const typeInfo = types[typeName];
  if (typeInfo && typeInfo.kind === "user_model" && typeInfo.properties) {
    visited.add(typeName);

    const propertyTypes = Object.values(typeInfo.properties);
    return propertyTypes.every((propType) => {
      const propTypeName = getPropertyTypeName(propType);
      return propTypeName
        ? hasDisplayComponent(propTypeName, types, visited)
        : false;
    });
  }

  return false;
}
