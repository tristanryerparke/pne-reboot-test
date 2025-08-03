import { NumberInput } from "../components/ui/number-input";
import { useState, useEffect } from "react";
import { getNodeData } from "../utils/get-node-data";
import { updateNodeData } from "../utils/update-node-data";
import { useNodeConnections } from '@xyflow/react';

interface FloatInputProps {
  path: (string | number)[];
}

export default function FloatInput({ path }: FloatInputProps) {
  // Get the field definition and current value from the store
  const fieldData = getNodeData(path) as { type: string; default_value?: number } | undefined;
  const currentValue = getNodeData([...path, 'value']) as number | undefined;
  
  // Use current value if it exists, otherwise use default_value, otherwise undefined
  const initialValue = typeof currentValue === 'number' ? currentValue : 
                      (fieldData?.default_value !== undefined ? fieldData.default_value : undefined);
  
  const [value, setValue] = useState<number | undefined>(initialValue);

  // Create handle ID for connection checking
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  
  // Use the xyflow hook to get connections to check if input is connected
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected = connections.length > 0 && connections[0].targetHandle === handleId;

  // Update local state when store value changes (from external updates)
  useEffect(() => {
    if (typeof currentValue === 'number' && currentValue !== value) {
      setValue(currentValue);
    } else if (currentValue === undefined && fieldData?.default_value !== undefined && value !== fieldData.default_value) {
      // If no current value but there's a default, use the default
      setValue(fieldData.default_value);
    }
  }, [currentValue, value, fieldData?.default_value]);

  if (!fieldData) {
    return <div>No field data</div>;
  }

  const handleValueChange = (newValue: number | undefined) => {
    setValue(newValue);
    // Update the store with the new value
    updateNodeData({ 
      path: [...path, 'value'], 
      newData: newValue ?? 0 
    });
  };

  const handleBlur = () => {
    if (value === undefined) {
      const defaultVal = fieldData?.default_value ?? 0;
      setValue(defaultVal);
      updateNodeData({ 
        path: [...path, 'value'], 
        newData: defaultVal 
      });
    }
  };

  return (
    <NumberInput
      value={value}
      decimalScale={fieldData.type === 'float' ? 3 : 0}
      onValueChange={handleValueChange}
      onBlur={handleBlur}
      disabled={isConnected}
      className="nodrag nopan noscroll h-9 w-full"
      placeholder={`Enter ${fieldData.type}`}
    />
  );
}