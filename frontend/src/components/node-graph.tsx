import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type NodeTypes,
  useReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback } from "react";
import CustomNode from "./custom-node/custom-node";
import useFlowStore from "../stores/flowStore";
import { useTheme } from "./theme-provider";
import { initializeUnionTypes } from "../utils/add-ui-data";

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
    setNodes,
    setRfInstance,
  } = useFlowStore();

  const { screenToFlowPosition } = useReactFlow();

  let colorMode: "dark" | "light";
  if (theme === "system") {
    colorMode = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } else {
    colorMode = theme;
  }

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const nodeDataString = event.dataTransfer.getData(
        "application/reactflow",
      );
      if (!nodeDataString) return;

      const nodeData = JSON.parse(nodeDataString);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Initialize selectedType for union types in arguments
      initializeUnionTypes(nodeData);

      const newNode: Node = {
        id: crypto.randomUUID(),
        position: {
          x: position.x,
          y: position.y,
        },
        type: "customNode",
        data: nodeData,
      };

      // Use functional update to avoid dependency on nodes array
      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        // fitView
        panOnScroll
      >
        <Controls />
        <MiniMap position="bottom-right" />
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          bgColor={colorMode === "dark" ? "#111111" : "#f8f8f8"}
        />
      </ReactFlow>
    </div>
  );
}

export default NodeGraph;
