import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/common/search-bar";
import { KindGroup } from "./kind-group";

export interface UnionType {
  anyOf: string[];
}

export interface TypeInfo {
  kind: string;
  category?: string[];
  type: string | UnionType;
  properties?: Record<string, any>;
}

export interface TypesByKind {
  [kind: string]: [string, TypeInfo][];
}

export function TypesBrowser() {
  const [types, setTypes] = useState<Record<string, TypeInfo>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTypes = useCallback(() => {
    fetch("http://localhost:8000/types")
      .then((response) => response.json())
      .then((data) => {
        console.log("types:", data);
        setTypes(data);
      });
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const filteredTypes = Object.entries(types).filter(([typeName, typeInfo]) => {
    const searchLower = searchTerm.toLowerCase();
    let typeStr = "";
    if (
      typeInfo.kind === "user_alias" &&
      typeof typeInfo.type === "object" &&
      "anyOf" in typeInfo.type
    ) {
      typeStr = typeInfo.type.anyOf.join(" | ");
    } else if (typeof typeInfo.type === "string") {
      typeStr = typeInfo.type;
    }
    return (
      typeName.toLowerCase().includes(searchLower) ||
      typeInfo.kind?.toLowerCase().includes(searchLower) ||
      typeInfo.category?.some((cat: string) =>
        cat.toLowerCase().includes(searchLower),
      ) ||
      typeStr.toLowerCase().includes(searchLower)
    );
  });

  const typesByKind = filteredTypes.reduce(
    (acc: TypesByKind, [typeName, typeInfo]) => {
      const kind = typeInfo.kind || "unknown";
      if (!acc[kind]) {
        acc[kind] = [];
      }
      acc[kind].push([typeName, typeInfo]);
      return acc;
    },
    {},
  );

  // Sort kinds: user_model, user_alias, builtin, then others
  const kindOrder = ["user_model", "user_alias", "builtin"];
  const sortedKinds = Object.entries(typesByKind).sort(([kindA], [kindB]) => {
    const indexA = kindOrder.indexOf(kindA);
    const indexB = kindOrder.indexOf(kindB);

    if (indexA === -1 && indexB === -1) return kindA.localeCompare(kindB);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="overflow-x-scroll overflow-y-hidden flex flex-col px-2 pt-2 gap-2">
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchTypes}
        placeholder="Search types..."
        refreshTitle="Refresh types"
        ariaLabel="Search types"
      />
      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span>Display components</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>No display components</span>
        </div>
      </div>
      <div className="overflow-y-scroll flex flex-col justify-start items-start pb-1">
        {sortedKinds.map(([kind, kindTypes], index) => (
          <KindGroup key={kind} kind={kind} types={kindTypes} />
        ))}
      </div>
    </div>
  );
}
