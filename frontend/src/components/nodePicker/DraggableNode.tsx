import { BaseNode } from '../../types/nodeTypes';

interface DraggableNodeProps {
  node: BaseNode;
}

export function DraggableNode({ node }: DraggableNodeProps) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    // Include both the node and additional metadata for the drop handler
    const dragData = {
      node,
      type: 'function-node',
      functionName: node.data.class_name,
      arguments: node.data.arguments,
      returnType: node.data.return_type
    };
    
    event.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="bg-background text-secondary-foreground border border-input p-2 rounded-md text-ellipsis overflow-hidden cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors"
      onDragStart={onDragStart}
      draggable
      title={`${node.data.display_name}${node.data.return_type ? ` → ${node.data.return_type}` : ''}`}
    >
      {node.data.display_name}
    </div>
  );
} 