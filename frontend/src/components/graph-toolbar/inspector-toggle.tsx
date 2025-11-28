import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import usePanelsStore from "@/stores/panelsStore";

export function InspectorToggle() {
  const { showInspector, toggleInspector } = usePanelsStore();

  return (
    <Button
      size="icon-sm"
      onClick={toggleInspector}
      aria-label="Toggle inspector"
      variant={showInspector ? "outline" : "secondary"}
    >
      <PanelRight className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle inspector</span>
    </Button>
  );
}
