import { createWithEqualityFn } from "zustand/traditional";
import { persist, type PersistOptions } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import type { StateCreator } from "zustand";

export interface UnionType {
  anyOf: string[];
}

export interface TypeInfo {
  kind: string;
  category?: string[];
  type: string | UnionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

type TypesPersist = (
  config: StateCreator<TypesState>,
  options: PersistOptions<TypesState>,
) => StateCreator<TypesState>;

const useTypesStore = createWithEqualityFn<TypesState>(
  (persist as TypesPersist)(
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
    {
      name: "types-storage",
    },
  ),
  shallow,
);

export default useTypesStore;
