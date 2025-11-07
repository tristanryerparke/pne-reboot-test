import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/common/search-bar";
import { KindGroup } from "./kind-group";

interface TypeInfo {
  kind: string;
  category?: string[];
  type?: string;
  properties?: Record<string, any>;
}

interface TypesByKind {
  [kind: string]: [string, TypeInfo][];
}

export function TypesBrowser() {
  const [types, setTypes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTypes = useCallback(() => {
    fetch("http://localhost:8000/types")
      .then((response) => response.json())
      .then((data) => {
        setTypes(data);
      });
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const filteredTypes = Object.entries(types).filter(([typeName, typeInfo]) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      typeName.toLowerCase().includes(searchLower) ||
      typeInfo.kind?.toLowerCase().includes(searchLower) ||
      typeInfo.category?.some((cat: string) =>
        cat.toLowerCase().includes(searchLower),
      ) ||
      typeInfo.type?.toLowerCase().includes(searchLower)
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
      <div className="overflow-y-scroll flex flex-col justify-start items-start pb-1">
        {sortedKinds.map(([kind, kindTypes], index) => (
          <KindGroup key={kind} kind={kind} types={kindTypes} />
        ))}
      </div>
    </div>
  );
}
