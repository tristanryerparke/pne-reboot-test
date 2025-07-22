import { memo, useState, useMemo, useRef, useEffect } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { type BaseNodeData, type NodeData, type InputField, type OutputField } from '../../types/nodeTypes';
import NodeHeader from './node-header';
import InputFieldComponent from './input-field';
import OutputFieldComponent from './output-field';
import JsonViewer from './json-viewer';
import { Separator } from '../ui/separator';

type CustomNodeData = Node<BaseNodeData & Record<string, unknown>>;

// Helper function to transform raw node data to structured format
function transformNodeData(rawData: any): BaseNodeData {
  const nodeData = rawData as NodeData;
  
  // Transform arguments to input fields
  const inputs: InputField[] = Object.entries(nodeData.arguments || {}).map(([key, value]) => ({
    label: key,
    type: value.type,
    value: value.value
  }));

  // Transform return to output fields
  const outputs: OutputField[] = nodeData.return ? [{
    label: 'result',
    type: nodeData.return.type,
    value: nodeData.return.value
  }] : [];

  return {
    name: nodeData.name,
    display_name: nodeData.name,
    category: nodeData.category || [],
    arguments: nodeData.arguments || {},
    return: nodeData.return || { type: 'void' },
    min_width: 200,
    max_width: 600,
    inputs,
    outputs
  };
}

export default memo(function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
  const [isJsonView, setIsJsonView] = useState(false);
  const [isResized, setIsResized] = useState(false);
  const [fitWidth, setFitWidth] = useState<number | undefined>(undefined);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Transform data if needed
  const transformedData = useMemo(() => {
    // Check if data is already in BaseNodeData format
    if (data.inputs && data.outputs) {
      return data as BaseNodeData;
    }
    // Otherwise transform from raw format
    return transformNodeData(data);
  }, [data]);

  // Measure the fit width when not resized
  useEffect(() => {
    if (!isResized && nodeRef.current) {
      const width = nodeRef.current.offsetWidth;
      setFitWidth(width);
    }
  }, [isResized, isJsonView, transformedData]);

  const toggleView = () => setIsJsonView(!isJsonView);
  
  const handleResizeStart = () => {
    if (nodeRef.current && !fitWidth) {
      setFitWidth(nodeRef.current.offsetWidth);
    }
    setIsResized(true);
  };

  return (
    <div 
      ref={nodeRef}
      className={`${isResized ? 
        'relative h-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground' :
        'relative w-fit h-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground'}`}
    >
      <NodeHeader 
        data={transformedData} 
        nodeId={id} 
        isJsonView={isJsonView}
        onToggleView={toggleView}
        onResizeStart={handleResizeStart}
        minWidth={fitWidth}
      />
      <Separator/>
      {isJsonView ? (
        <JsonViewer data={data} className="w-full h-full" />
      ) : (
        <>
          <div>
            {transformedData.inputs.map((input, index) => (
              <div key={index} className='node-field-input'>
                {index > 0 && <Separator/>}
                <InputFieldComponent
                  path={[id, 'inputs', index]}
                  field={input}
                />
              </div>
            ))}
          </div>
          {transformedData.outputs.length > 0 && (
            <>
              <Separator/>
              <div>
                {transformedData.outputs.map((output, index) => (
                  <div key={index} className='node-field-output'>
                    {index > 0 && <div className='divider-div'/>}
                    <OutputFieldComponent 
                      path={[id, 'outputs', index]}
                      field={output} 
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}); 