import { NodeDocTooltip } from "../custom-node/docstring-tooltip";

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
    <NodeDocTooltip description={nodeData.doc || ""}>
      <div
        className="bg-background text-secondary-foreground border border-input p-2 rounded-md text-ellipsis overflow-hidden cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors"
        onDragStart={onDragStart}
        draggable
      >
        {nodeData.name}
      </div>
    </NodeDocTooltip>
  );
}
