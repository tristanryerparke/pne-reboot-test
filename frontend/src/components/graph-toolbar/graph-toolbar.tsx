import { ModeToggle } from "./mode-toggle";
import ExecuteButton from "./execute-button";
import SaveButton from "./save-button";
import { LoadButton } from "./load-button";

export default function GraphToolbar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-row gap-2 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
      <ModeToggle />
      <ExecuteButton />
      <SaveButton />
      <LoadButton />
    </div>
  );
}
