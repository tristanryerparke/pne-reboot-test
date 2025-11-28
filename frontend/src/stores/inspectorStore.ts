import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

type InspectorTarget = {
  nodeId: string;
  path: (string | number)[];
} | null;

type InspectorStoreState = {
  isSelecting: boolean;
  selectedTarget: InspectorTarget;
  showBorders: boolean;
};

type InspectorStoreActions = {
  setIsSelecting: (isSelecting: boolean) => void;
  setSelectedTarget: (target: InspectorTarget) => void;
  selectTarget: (nodeId: string, path: (string | number)[]) => void;
  clearSelection: () => void;
  clearSelectedTarget: () => void;
  setShowBorders: (show: boolean) => void;
};

export type InspectorState = InspectorStoreState & InspectorStoreActions;

const useInspectorStore = createWithEqualityFn<
  InspectorState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set) => ({
      isSelecting: false,
      selectedTarget: null,
      showBorders: true,

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

      setShowBorders: (show) => set({ showBorders: show }),
    }),
    {
      name: "inspector-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedTarget: state.selectedTarget,
        showBorders: state.showBorders,
      }),
    },
  ),
  shallow,
);

export default useInspectorStore;
