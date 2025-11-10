import { TYPE_COMPONENT_REGISTRY } from "../custom-node/dynamic-input";

export function hasDisplayComponent(typeName: string): boolean {
  return typeName in TYPE_COMPONENT_REGISTRY;
}
