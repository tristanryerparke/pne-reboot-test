import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/vanilla/shallow";
import { persist, createJSONStorage } from "zustand/middleware";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type {
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance,
  Viewport,
} from "@xyflow/react";
import { produce } from "immer";
import type { FunctionNode } from "../types/types";

type FlowStoreState = {
  nodes: FunctionNode[];
  edges: Edge[];
  viewport: Viewport;
  rfInstance: ReactFlowInstance<FunctionNode, Edge> | null;
};

type FlowStoreActions = {
  setNodes: (
    nodes: FunctionNode[] | ((currentNodes: FunctionNode[]) => FunctionNode[]),
  ) => void;
  setEdges: (edges: Edge[]) => void;
  setViewport: (viewport: Viewport) => void;
  setRfInstance: (instance: ReactFlowInstance<FunctionNode, Edge>) => void;
  onNodesChange: OnNodesChange<FunctionNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (path: (string | number)[], newData: unknown) => void;
  getNodeData: (path: (string | number)[]) => unknown;
  deleteNodeData: (path: (string | number)[]) => void;
};

export type FlowState = FlowStoreState & FlowStoreActions;

const useFlowStore = createWithEqualityFn<
  FlowState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
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

      onConnect: (connection) =>
        set({ edges: addEdge(connection, get().edges) }),

      setNodes: (nodes) =>
        set({
          nodes: typeof nodes === "function" ? nodes(get().nodes) : nodes,
        }),

      setEdges: (edges) => set({ edges }),

      setViewport: (viewport) => set({ viewport }),

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current = current[key] as any;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current = current[key] as any;
        }

        return current;
      },

      deleteNodeData: (path) => {
        set(
          produce((state: FlowState) => {
            const nodeIndex = state.nodes.findIndex(
              (node) => node.id === path[0],
            );
            if (nodeIndex !== -1) {
              let current = state.nodes[nodeIndex].data;
              const pathToProperty = path.slice(1);

              // Navigate to the parent object
              for (let i = 0; i < pathToProperty.length - 1; i++) {
                const key = pathToProperty[i];
                if (current[key] === undefined) {
                  console.warn(
                    `Property not found at path: ${path.slice(0, i + 2).join(".")}`,
                  );
                  return;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current = current[key] as any;
              }

              // Delete the final property
              const finalKey = pathToProperty[pathToProperty.length - 1];
              delete current[finalKey];
              console.log("deleted data at path:", path);
            }
          }),
        );
      },
    }),
    {
      name: "flow-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
      }),
    },
  ),
  shallow,
);

export const useNodeData = (path: (string | number)[]) => {
  return useFlowStore((state) => {
    const node = state.nodes.find((n) => n.id === path[0]);
    if (!node) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = node.data;
    for (let i = 1; i < path.length; i++) {
      if (current === undefined) return undefined;
      current = current[path[i]];
    }
    return current;
  });
};

export default useFlowStore;
