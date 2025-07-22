import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { type OutputField } from '../../types/nodeTypes';
import { EdgeConnectedProvider } from '../../contexts/edgeConnectedContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface OutputFieldComponentProps {
  path: (string | number)[];
  field: OutputField;
}

export default function OutputFieldComponent({ path, field }: OutputFieldComponentProps) {
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

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
                {field.user_label ?? field.label}{': '}{field.type}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={7}>
          <span className="text-lg">{field.type}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
} 