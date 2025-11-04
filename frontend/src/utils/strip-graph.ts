interface GraphNode {
  id: string;
  position?: { x: number; y: number };
  type?: string;
  data: any;
  measured?: { width: number; height: number };
  selected?: boolean;
  [key: string]: any;
}

interface Graph {
  nodes: GraphNode[];
  edges: any[];
}

interface StrippedNode {
  id: string;
  data: any;
  [key: string]: any;
}

interface StrippedGraph {
  nodes: StrippedNode[];
  edges: any[];
}

const NODE_FIELDS_TO_STRIP = [
  "type",
  "dragging",
  "measured",
  "selected",
] as const;

export function stripGraphForExecute(graph: Graph): StrippedGraph {
  const strippedNodes = graph.nodes.map((node) => {
    const strippedNode = { ...node };
    NODE_FIELDS_TO_STRIP.forEach((field) => {
      delete strippedNode[field];
    });
    return strippedNode;
  });

  return {
    nodes: strippedNodes,
    edges: graph.edges,
  };
}
