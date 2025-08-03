import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { getNodeData } from '../../utils/get-node-data';

interface OutputFieldComponentProps {
  path: (string | number)[];
}

export default function OutputFieldComponent({ path }: OutputFieldComponentProps) {
  const field = getNodeData(path) as { type: string } | undefined;
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

  if (!field) {
    return <div>No field data</div>;
  }

  // Use the xyflow hook to get connections
  const connections = useNodeConnections({
    handleType: 'source',
    handleId: handleId,
  });

  // Determine if connected based on connections array length and source node id
  const isConnected = connections.length > 0 && connections[0].sourceHandle === handleId;

  return (
    <div className="relative w-full" >
      <Handle 
        className="p-1 rounded-full bg-primary"
        type="source" 
        position={Position.Right}
        id={handleId}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full pl-2 pr-3 py-2 gap-1 overflow-hidden items-center justify-end">
            <div className="flex items-center flex-shrink-0">
              <span>
                return
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={2} className="px-2 py-1 text-xs rounded-sm">
          <span className="text-xs">{field.type}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
} 