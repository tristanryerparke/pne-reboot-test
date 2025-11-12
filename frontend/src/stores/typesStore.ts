import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";

export interface UnionType {
  anyOf: string[];
}

export interface TypeInfo {
  kind: string;
  category?: string[];
  type: string | UnionType;
  properties?: Record<string, any>;
}

type TypesStoreState = {
  types: Record<string, TypeInfo>;
};

type TypesStoreActions = {
  setTypes: (types: Record<string, TypeInfo>) => void;
  fetchTypes: () => Promise<void>;
};

export type TypesState = TypesStoreState & TypesStoreActions;

const useTypesStore = createWithEqualityFn<TypesState>(
  (set) => ({
    types: {},

    setTypes: (types) => set({ types }),

    fetchTypes: async () => {
      try {
        const response = await fetch("http://localhost:8000/types");
        const data = await response.json();
        console.log("types:", data);
        set({ types: data });
      } catch (error) {
        console.error("Failed to fetch types:", error);
      }
    },
  }),
  shallow,
);

export default useTypesStore;
