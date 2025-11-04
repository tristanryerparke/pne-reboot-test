import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import useStore from '../store';
import { useState, useCallback } from 'react';
import { updateNodeData } from '../utils/update-node-data';

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  

  const execute = useCallback(async () => {
    setLoading(true);
    const executeMessage = {
      nodes: nodes,
      edges: edges,
    }

    try {
      const response = await fetch('http://localhost:8000/graph_execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executeMessage),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Update outputs for each node
        Object.entries(result.updated_outputs).forEach(([nodeId, outputData]) => {
          const path = [nodeId, 'return'];
          updateNodeData({ path, newData: outputData as any });
        });

        // Update inputs for nodes that received values from connections
        Object.entries(result.updated_inputs).forEach(([nodeId, inputData]) => {
          // Find the corresponding edge to get the target handle information
          const relevantEdge = edges.find(edge => edge.target === nodeId);
          if (relevantEdge) {
            // Extract the argument name from the target handle
            const handleParts = relevantEdge.targetHandle.split(':');
            const argumentName = handleParts[2]; // Format: nodeId:arguments:argumentName:handle
            
            // Get the argument data and update only the value property
            Object.entries(inputData as Record<string, {value: any, type: string}>).forEach(([argName, argData]) => {
              const valuePath = [nodeId, 'arguments', argName, 'value'];
              updateNodeData({ path: valuePath, newData: argData.value });
            });
          }
        });

        console.log('Graph execution completed successfully');
      } else {
        console.error('Graph execution failed:', result.message);
      }
    } catch (error) {
      console.error('Error executing graph:', error);
    } finally {
      setLoading(false);
    }
  }, [nodes, edges]);

  return <div className='w-full'>
    <Button
      className='w-full'
      onClick={execute}
      disabled={loading}
    >
      {loading ? (
        <LoaderIcon className="animate-spin" />
      ) : (
        "Execute"
      )}
    </Button>
  </div>
}