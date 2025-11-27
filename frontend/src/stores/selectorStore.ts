import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";

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

const useSelectorStore = createWithEqualityFn<SelectorState>(
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
  shallow,
);

export default useSelectorStore;
