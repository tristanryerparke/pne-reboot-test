interface GraphNode {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  position?: { x: number; y: number };
}

export interface Graph {
  nodes: GraphNode[];
  edges: object[];
}

interface StrippedNode {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  position?: { x: number; y: number };
}

interface StrippedGraph {
  nodes: StrippedNode[];
  edges: object[];
}

const NODE_DATA_FIELDS_TO_KEEP = [
  "callableId",
  "arguments",
  "outputs",
  "outputStyle",
] as const;

export function stripGraphForExecute(graph: Graph): StrippedGraph {
  const strippedNodes = graph.nodes.map((node) => {
    const strippedData: any = {};
    NODE_DATA_FIELDS_TO_KEEP.forEach((field) => {
      if (field in node.data) {
        if (field === "arguments" || field === "outputs") {
          // Deep copy arguments/outputs and remove all frontend-only fields (prefixed with _)
          const data = JSON.parse(JSON.stringify(node.data[field]));
          Object.keys(data).forEach((key) => {
            Object.keys(data[key]).forEach((prop) => {
              if (prop.startsWith("_")) {
                delete data[key][prop];
              }
            });
          });
          strippedData[field] = data;
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
