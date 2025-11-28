import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import usePanelsStore from "@/stores/panelsStore";

export function NodePickerToggle() {
  const { showNodePicker, toggleNodePicker } = usePanelsStore();

  return (
    <Button
      size="icon-sm"
      onClick={toggleNodePicker}
      aria-label="Toggle node picker"
      variant={showNodePicker ? "outline" : "secondary"}
    >
      <PanelLeft className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle node picker</span>
    </Button>
  );
}
