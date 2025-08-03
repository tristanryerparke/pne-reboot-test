import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { type InputField } from '../../types/nodeTypes';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface InputFieldProps {
  path: (string | number)[];
  field: InputField;
}

export default function InputFieldComponent({ path, field }: InputFieldProps) {
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;

  // Use the xyflow hook to get connections
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: handleId,
  });

  // Determine if connected based on connections array length and target node id
  const isConnected = connections.length > 0 && connections[0].targetHandle === handleId;

  return (
    <div className="relative w-full" >
      <Handle 
        // TODO: Why don't height and width work?
        className="p-1 rounded-full bg-primary"
        type="target" 
        position={Position.Left}
        id={handleId}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full pl-3 pr-2 py-2 gap-1 overflow-hidden items-center">
            <div className="flex items-center flex-shrink-0">
              <span>
                {field.user_label ?? field.label}{': '}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={2} className="px-2 py-1 text-xs rounded-sm">
          <span className="text-xs">{field.type}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
} 