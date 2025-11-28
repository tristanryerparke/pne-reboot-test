import { createWithEqualityFn } from "zustand/traditional";
import { persist, type PersistOptions } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import type { StateCreator } from "zustand";

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

type InspectorPersist = (
  config: StateCreator<InspectorState>,
  options: PersistOptions<InspectorState>,
) => StateCreator<InspectorState>;

const useInspectorStore = createWithEqualityFn<InspectorState>(
  (persist as InspectorPersist)(
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
    },
  ),
  shallow,
);

export default useInspectorStore;
