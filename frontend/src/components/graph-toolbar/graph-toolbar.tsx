import { ModeToggle } from "./mode-toggle";
import ExecuteButton from "./execute-button";
import SaveButton from "./save-button";
import { LoadButton } from "./load-button";
import { InspectorToggle } from "./inspector-toggle";
import { NodePickerToggle } from "./node-picker-toggle";
import { ButtonGroup } from "@/components/ui/button-group";

export default function GraphToolbar() {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex flex-row gap-2 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
      <NodePickerToggle />
      <ModeToggle />
      <ExecuteButton />
      <ButtonGroup>
        <SaveButton />
        <LoadButton />
      </ButtonGroup>
      <InspectorToggle />
    </div>
  );
}
