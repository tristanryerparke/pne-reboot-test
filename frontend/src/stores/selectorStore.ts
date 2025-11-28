import { createWithEqualityFn } from "zustand/traditional";
import { persist, type PersistOptions } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import type { StateCreator } from "zustand";

type SelectorTarget = {
  nodeId: string;
  path: (string | number)[];
} | null;

type SelectorStoreState = {
  isSelecting: boolean;
  selectedTarget: SelectorTarget;
  hoveredByInspector: boolean;
};

type SelectorStoreActions = {
  setIsSelecting: (isSelecting: boolean) => void;
  setSelectedTarget: (target: SelectorTarget) => void;
  selectTarget: (nodeId: string, path: (string | number)[]) => void;
  clearSelection: () => void;
  clearSelectedTarget: () => void;
  setHoveredByInspector: (hovered: boolean) => void;
};

export type SelectorState = SelectorStoreState & SelectorStoreActions;

type SelectorPersist = (
  config: StateCreator<SelectorState>,
  options: PersistOptions<SelectorState>,
) => StateCreator<SelectorState>;

const useSelectorStore = createWithEqualityFn<SelectorState>(
  (persist as SelectorPersist)(
    (set) => ({
      isSelecting: false,
      selectedTarget: null,
      hoveredByInspector: false,

      setIsSelecting: (isSelecting) => set({ isSelecting }),

      setSelectedTarget: (target) => set({ selectedTarget: target }),

      selectTarget: (nodeId, path) => {
        set({
          selectedTarget: { nodeId, path },
          isSelecting: false,
        });
      },

      clearSelection: () => {
        set({
          selectedTarget: null,
          isSelecting: false,
        });
      },

      clearSelectedTarget: () => {
        set({ selectedTarget: null });
      },

      setHoveredByInspector: (hovered) => set({ hoveredByInspector: hovered }),
    }),
    {
      name: "selector-storage",
    },
  ),
  shallow,
);

export default useSelectorStore;
