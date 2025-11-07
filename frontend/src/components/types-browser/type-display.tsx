import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

interface TypeInfo {
  kind: string;
  category?: string[];
  type?: string;
  properties?: Record<string, any>;
}

interface TypeDisplayProps {
  typeName: string;
  typeInfo: TypeInfo;
}

function formatPropertyType(propType: any): string {
  if (typeof propType === "string") {
    return propType;
  }
  if (propType.type === "array" && propType.items) {
    return `List[${propType.items}]`;
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
              <span className="block text-xs">{typeInfo.type}</span>
            </span>
          )}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
