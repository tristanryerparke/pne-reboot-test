import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeSelect } from "../theme-select";

const BACKEND_URL = "http://localhost:8000";

export function SettingsModal() {
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
