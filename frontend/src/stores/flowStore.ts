import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance,
} from "@xyflow/react";
import { produce } from "immer";

type FlowStoreState = {
  nodes: Node[];
  edges: Edge[];
  rfInstance: ReactFlowInstance | null;
};

type FlowStoreActions = {
  setNodes: (nodes: Node[] | ((currentNodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[]) => void;
  setRfInstance: (instance: ReactFlowInstance) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (path: (string | number)[], newData: unknown) => void;
  getNodeData: (path: (string | number)[]) => unknown;
};

export type FlowState = FlowStoreState & FlowStoreActions;

const useFlowStore = createWithEqualityFn<FlowState>(
  (set, get) => ({
    nodes: [],
    edges: [],
    rfInstance: null,

    onNodesChange: (changes) => {
      set(
        produce((state: FlowState) => {
          const nodesCopy = [...state.nodes];
          const updatedNodes = applyNodeChanges(changes, nodesCopy);
          state.nodes = updatedNodes;
        }),
      );
    },

    onEdgesChange: (changes) => {
      set(
        produce((state: FlowState) => {
          const edgesCopy = [...state.edges];
          const updatedEdges = applyEdgeChanges(changes, edgesCopy);
          state.edges = updatedEdges;
        }),
      );
    },

    onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

    setNodes: (nodes) =>
      set({ nodes: typeof nodes === "function" ? nodes(get().nodes) : nodes }),

    setEdges: (edges) => set({ edges }),

    setRfInstance: (instance) => set({ rfInstance: instance }),

    updateNodeData: (path, newData) => {
      const oldValue = get().getNodeData(path);

      set(
        produce((state: FlowState) => {
          const nodeIndex = state.nodes.findIndex(
            (node) => node.id === path[0],
          );
          if (nodeIndex !== -1) {
            let current = state.nodes[nodeIndex].data;
            const pathToProperty = path.slice(1);

            for (let i = 0; i < pathToProperty.length - 1; i++) {
              const key = pathToProperty[i];
              if (current[key] === undefined) {
                console.warn(
                  `Creating new nested property: ${key} at path: ${path.slice(0, i + 2).join(".")}`,
                );
                current[key] = {};
              }
              current = current[key] as Record<string | number, unknown>;
            }

            const finalKey = pathToProperty[pathToProperty.length - 1];
            current[finalKey] = newData;
          }
        }),
      );

      console.log("updating ", path, "\n from", oldValue, "to", newData);
    },

    getNodeData: (path) => {
      const nodes = get().nodes;
      const nodeIndex = nodes.findIndex((node) => node.id === path[0]);

      if (nodeIndex === -1) {
        return undefined;
      }

      let current = nodes[nodeIndex].data;
      const pathToProperty = path.slice(1);

      for (let i = 0; i < pathToProperty.length; i++) {
        const key = pathToProperty[i];
        if (current[key] === undefined) {
          return undefined;
        }
        current = current[key] as Record<string | number, unknown>;
      }

      return current;
    },
  }),
  shallow,
);

export const useNodeData = (path: (string | number)[]) => {
  return useFlowStore((state) => {
    const node = state.nodes.find((n) => n.id === path[0]);
    if (!node) return undefined;

    let current: any = node.data;
    for (let i = 1; i < path.length; i++) {
      if (current === undefined) return undefined;
      current = current[path[i]];
    }
    return current;
  });
};

export default useFlowStore;
