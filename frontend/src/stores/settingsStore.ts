import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light" | "system";
type ExecutionMode = "sync" | "async";

type SettingsStoreState = {
  theme: Theme;
  openInEditorName: string | null;
  executionMode: ExecutionMode;
};

type SettingsStoreActions = {
  setTheme: (theme: Theme) => void;
  setOpenInEditorName: (editorName: string | null) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
};

export type SettingsState = SettingsStoreState & SettingsStoreActions;

const useSettingsStore = createWithEqualityFn<
  SettingsState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set) => ({
      theme: "system",
      openInEditorName: "vscode",
      executionMode: "sync",

      setTheme: (theme) => set({ theme }),

      setOpenInEditorName: (editorName) =>
        set({ openInEditorName: editorName }),

      setExecutionMode: (mode) => set({ executionMode: mode }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        openInEditorName: state.openInEditorName,
        executionMode: state.executionMode,
      }),
    },
  ),
  shallow,
);

export default useSettingsStore;
