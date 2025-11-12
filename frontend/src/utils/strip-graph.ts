interface GraphNode {
  id: string;
  position?: { x: number; y: number };
  type?: string;
  data: any;
  measured?: { width?: number; height?: number };
  selected?: boolean;
  [key: string]: any;
}

export interface Graph {
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

const NODE_FIELDS_TO_KEEP = ["id", "position", "data"] as const;
const NODE_DATA_FIELDS_TO_KEEP = [
  "callable_id",
  "arguments",
  "outputs",
  "output_style",
] as const;

export function stripGraphForExecute(graph: Graph): StrippedGraph {
  const strippedNodes = graph.nodes.map((node) => {
    const strippedData: any = {};
    NODE_DATA_FIELDS_TO_KEEP.forEach((field) => {
      if (field in node.data) {
        if (field === "arguments") {
          // Deep copy arguments and remove selectedType
          const args = JSON.parse(JSON.stringify(node.data[field]));
          Object.keys(args).forEach((argName) => {
            if (args[argName].selectedType !== undefined) {
              delete args[argName].selectedType;
            }
          });
          strippedData[field] = args;
        } else {
          strippedData[field] = node.data[field];
        }
      }
    });

    const strippedNode: StrippedNode = {
      id: node.id,
      data: strippedData,
    };

    if (node.position) {
      strippedNode.position = node.position;
    }

    return strippedNode;
  });

  return {
    nodes: strippedNodes,
    edges: graph.edges,
  };
}
