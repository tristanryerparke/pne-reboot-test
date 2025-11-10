import { DocstringTooltip } from "./docstring-tooltip";
import { Item, ItemTitle } from "@/components/ui/item";

interface DraggableNodeProps {
  nodeData: any;
}

export function DraggableNode({ nodeData }: DraggableNodeProps) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(nodeData),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <DocstringTooltip description={nodeData.doc || ""}>
      <Item
        variant="outline"
        className="p-2 cursor-grab hover:bg-accent hover:text-accent-foreground"
        onDragStart={onDragStart}
        draggable
      >
        <ItemTitle className="pb-0">{nodeData.name}</ItemTitle>
      </Item>
    </DocstringTooltip>
  );
}
