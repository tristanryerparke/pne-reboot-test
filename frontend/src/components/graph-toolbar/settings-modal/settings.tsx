import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ThemeSelect } from "./theme-select";
import useSettingsStore from "@/stores/settingsStore";

const BACKEND_URL = "http://localhost:8000";

export function SettingsModal() {
  const openInEditorName = useSettingsStore((state) => state.openInEditorName);
  const setOpenInEditorName = useSettingsStore(
    (state) => state.setOpenInEditorName,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="outline" aria-label="Open settings">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Theme</label>
            <ThemeSelect />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="editor-name" className="text-sm font-medium">
                Editor Name
              </label>
              <Input
                id="editor-name"
                type="text"
                placeholder="e.g., zed, vscode"
                value={openInEditorName || ""}
                onChange={(e) => setOpenInEditorName(e.target.value || null)}
                className="min-w-40 max-w-40 min-h-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for "Open in Editor" links (e.g., zed://file/path)
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Backend Address</label>
            <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md">
              {BACKEND_URL}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
