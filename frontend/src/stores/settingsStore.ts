import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

type SettingsStoreState = {
  theme: Theme;
  openInEditorName: string | null;
};

type SettingsStoreActions = {
  setTheme: (theme: Theme) => void;
  setOpenInEditorName: (editorName: string | null) => void;
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

      setTheme: (theme) => set({ theme }),

      setOpenInEditorName: (editorName) =>
        set({ openInEditorName: editorName }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        openInEditorName: state.openInEditorName,
      }),
    },
  ),
  shallow,
);

export default useSettingsStore;
