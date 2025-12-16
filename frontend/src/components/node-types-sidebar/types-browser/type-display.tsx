import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import useTypesStore, {
  type TypeInfo,
  type PropertyType,
} from "@/stores/typesStore";
import { hasDisplayComponent } from "./has-display-component";

interface TypeDisplayProps {
  typeName: string;
  typeInfo: TypeInfo;
}

function formatPropertyType(propType: PropertyType): string {
  if (typeof propType === "string") {
    return propType;
  }
  if ("anyOf" in propType) {
    return propType.anyOf.map(formatPropertyType).join(" | ");
  }
  if (
    "type" in propType &&
    propType.type === "list" &&
    "itemsType" in propType
  ) {
    return `list[${formatPropertyType(propType.itemsType)}]`;
  }
  return JSON.stringify(propType);
}

export function TypeDisplay({ typeName, typeInfo }: TypeDisplayProps) {
  const types = useTypesStore((state) => state.types);
  const hasComponent = hasDisplayComponent(typeName, types);

  return (
    <Item variant="outline" className="p-2 h-fit-content">
      <ItemContent className="gap-0 min-w-0">
        <ItemTitle className="pb-0">{typeName}</ItemTitle>
        <ItemDescription className="line-clamp-none break-words">
          {typeInfo.kind === "user_model" && typeInfo.properties && (
            <span className="block mt-1">
              <span className="block text-xs">
                {Object.entries(typeInfo.properties).map(
                  ([propName, propType]) => (
                    <span key={propName} className="block break-words">
                      {propName}: {formatPropertyType(propType)}
                    </span>
                  ),
                )}
              </span>
            </span>
          )}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${
            hasComponent ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </ItemActions>
    </Item>
  );
}
