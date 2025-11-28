import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

const MIN_WIDTH_FOR_INSPECTOR = 740; // 500px + 240px (min-w-60)
const MIN_WIDTH_FOR_NODE_PICKER = 640; // minimum width to show node picker

type PanelsStoreState = {
  showInspector: boolean;
  showNodePicker: boolean;
  userWantsInspector: boolean;
  userWantsNodePicker: boolean;
};

type PanelsStoreActions = {
  setShowInspector: (show: boolean) => void;
  setShowNodePicker: (show: boolean) => void;
  toggleInspector: () => void;
  toggleNodePicker: () => void;
  handleResize: () => void;
};

export type PanelsState = PanelsStoreState & PanelsStoreActions;

const usePanelsStore = createWithEqualityFn<
  PanelsState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set, get) => ({
      showInspector: false,
      showNodePicker: true,
      userWantsInspector: false,
      userWantsNodePicker: true,

      setShowInspector: (show) => set({ showInspector: show }),

      setShowNodePicker: (show) => set({ showNodePicker: show }),

      toggleInspector: () => {
        const newState = !get().userWantsInspector;
        set({ userWantsInspector: newState });
        if (window.innerWidth >= MIN_WIDTH_FOR_INSPECTOR) {
          set({ showInspector: newState });
        }
      },

      toggleNodePicker: () => {
        const newState = !get().userWantsNodePicker;
        set({ userWantsNodePicker: newState });
        if (window.innerWidth >= MIN_WIDTH_FOR_NODE_PICKER) {
          set({ showNodePicker: newState });
        }
      },

      handleResize: () => {
        const { userWantsInspector, userWantsNodePicker } = get();
        const hasEnoughSpaceForInspector =
          window.innerWidth >= MIN_WIDTH_FOR_INSPECTOR;
        const hasEnoughSpaceForNodePicker =
          window.innerWidth >= MIN_WIDTH_FOR_NODE_PICKER;
        set({
          showInspector: userWantsInspector && hasEnoughSpaceForInspector,
          showNodePicker: userWantsNodePicker && hasEnoughSpaceForNodePicker,
        });
      },
    }),
    {
      name: "panels-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userWantsInspector: state.userWantsInspector,
        userWantsNodePicker: state.userWantsNodePicker,
      }),
    },
  ),
  shallow,
);

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    usePanelsStore.getState().handleResize();
  });

  usePanelsStore.getState().handleResize();
}

export default usePanelsStore;
