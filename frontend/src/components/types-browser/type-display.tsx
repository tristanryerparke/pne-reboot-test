import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { type TypeInfo } from "./types-browser";

interface TypeDisplayProps {
  typeName: string;
  typeInfo: TypeInfo;
}

function formatPropertyType(propType: any): string {
  if (typeof propType === "string") {
    return propType;
  }
  if (propType.anyOf) {
    return propType.anyOf.map(formatPropertyType).join(" | ");
  }
  if (propType.type === "array" && propType.items) {
    return `list[${formatPropertyType(propType.items)}]`;
  }
  return JSON.stringify(propType);
}

export function TypeDisplay({ typeName, typeInfo }: TypeDisplayProps) {
  return (
    <Item variant="outline" className="p-2 h-fit-content">
      <ItemContent className="gap-0">
        <ItemTitle className="pb-0">{typeName}</ItemTitle>
        <ItemDescription>
          {typeInfo.kind === "user_model" && typeInfo.properties && (
            <span className="block mt-1">
              <span className="block text-xs">
                {Object.entries(typeInfo.properties).map(
                  ([propName, propType]) => (
                    <span key={propName} className="block">
                      {propName}: {formatPropertyType(propType)}
                    </span>
                  ),
                )}
              </span>
            </span>
          )}
          {typeInfo.kind === "user_alias" && typeInfo.type && (
            <span className="block mt-1">
              <span className="block text-xs">
                {formatPropertyType(typeInfo.type)}
              </span>
            </span>
          )}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
