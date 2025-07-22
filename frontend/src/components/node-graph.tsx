import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type NodeTypes,
  useReactFlow,
  Handle,
  Position,
} from '@xyflow/react';
import { useCallback } from 'react';
import { CustomNode } from './custom-node';
import useStore from '../store';
import { useTheme } from './theme-provider';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

function NodeGraph() {
  const { theme } = useTheme();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setNodes 
  } = useStore();

  const { screenToFlowPosition } = useReactFlow();

  let colorMode: 'dark' | 'light';
  if (theme === 'system') {
    colorMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    colorMode = theme;
  }

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataString) return;
      
      const nodeData = JSON.parse(nodeDataString);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: Node = {
        id: crypto.randomUUID(),
        position: {
          x: position.x,
          y: position.y,
        },
        type: 'customNode',
        data: nodeData,
      };
      
      setNodes([...nodes, newNode]);
    },
    [screenToFlowPosition, setNodes, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  return (
    <div style={{width: '100%', height: '100%'}}>
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        fitView
        panOnScroll
      >
        <Controls />
        <MiniMap position='bottom-right'/>
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1} 
          bgColor={colorMode === 'dark' ? '#111111' : '#f8f8f8'}
        />
      </ReactFlow>
    </div>
  )
}

export default NodeGraph;