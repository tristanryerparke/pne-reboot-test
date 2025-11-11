// import { create, createWithEqualityFn } from "zustand";
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

// Type definitions for types browser
export interface UnionType {
  anyOf: string[];
}

export interface TypeInfo {
  kind: string;
  category?: string[];
  type: string | UnionType;
  properties?: Record<string, any>;
}

// Type definitions for node schemas
export interface NodeFunctionData {
  name: string;
  group: string;
  category: string[];
  arguments: Record<
    string,
    {
      type: string;
      default_value?: any;
    }
  >;
  return: {
    type: string;
  };
}

export interface NodesResponse {
  [functionName: string]: NodeFunctionData;
}

// Separate state and actions following Zustand best practices
type AppStoreState = {
  nodes: Node[];
  edges: Edge[];
  rfInstance: ReactFlowInstance | null;
  types: Record<string, TypeInfo>;
  nodeSchemas: NodesResponse;
};

type AppStoreActions = {
  setNodes: (nodes: Node[] | ((currentNodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[]) => void;
  setRfInstance: (instance: ReactFlowInstance) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (path: (string | number)[], newData: unknown) => void;
  getNodeData: (path: (string | number)[]) => unknown;
  setTypes: (types: Record<string, TypeInfo>) => void;
  fetchTypes: () => Promise<void>;
  setNodeSchemas: (nodeSchemas: NodesResponse) => void;
  fetchNodeSchemas: () => Promise<void>;
};

export type AppState = AppStoreState & AppStoreActions;

const useStore = createWithEqualityFn<AppState>(
  (set, get) => ({
    nodes: [], // initial state for nodes, used in NodeGraph
    edges: [], // initial state for edges, used in NodeGraph
    rfInstance: null,
    types: {},
    nodeSchemas: {},

    onNodesChange: (changes) => {
      set(
        produce((state: AppState) => {
          // Create a mutable copy of nodes just for applyNodeChanges
          const nodesCopy = [...state.nodes];
          // Apply changes to the copy
          const updatedNodes = applyNodeChanges(changes, nodesCopy);
          // Update the state with the results
          state.nodes = updatedNodes;
        }),
      );
    },

    onEdgesChange: (changes) => {
      set(
        produce((state: AppState) => {
          // Create a mutable copy of edges just for applyEdgeChanges
          const edgesCopy = [...state.edges];
          // Apply changes to the copy
          const updatedEdges = applyEdgeChanges(changes, edgesCopy);
          // Update the state with the results
          state.edges = updatedEdges;
        }),
      );
    },
    onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
    setNodes: (nodes) =>
      set({ nodes: typeof nodes === "function" ? nodes(get().nodes) : nodes }),
    setEdges: (edges) => set({ edges }),
    setRfInstance: (instance) => set({ rfInstance: instance }),

    // Action to update node data at a specific path
    updateNodeData: (path, newData) => {
      // Get old value BEFORE produce to avoid logging Immer proxy
      const oldValue = get().getNodeData(path);

      set(
        produce((state: AppState) => {
          const nodeIndex = state.nodes.findIndex(
            (node) => node.id === path[0],
          );
          if (nodeIndex !== -1) {
            // Navigate to the target property
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

            // Update the property
            const finalKey = pathToProperty[pathToProperty.length - 1];
            current[finalKey] = newData;
          }
        }),
      );

      // Log the update AFTER produce with the actual old value
      console.log("updating ", path, "\n from", oldValue, "to", newData);
    },

    // Method to get data at a specific path
    getNodeData: (path) => {
      const nodes = get().nodes;
      const nodeIndex = nodes.findIndex((node) => node.id === path[0]);

      if (nodeIndex === -1) {
        return undefined; // Node not found
      }

      // Start with the node's data
      let current = nodes[nodeIndex].data;
      const pathToProperty = path.slice(1);

      // Navigate through the path
      for (let i = 0; i < pathToProperty.length; i++) {
        const key = pathToProperty[i];
        if (current[key] === undefined) {
          return undefined; // Path doesn't exist
        }
        current = current[key] as Record<string | number, unknown>;
      }

      return current; // Return the data at the specified path
    },

    // Types management
    setTypes: (types) => set({ types }),

    fetchTypes: async () => {
      try {
        const response = await fetch("http://localhost:8000/types");
        const data = await response.json();
        console.log("types:", data);
        set({ types: data });
      } catch (error) {
        console.error("Failed to fetch types:", error);
      }
    },

    // Node schemas management
    setNodeSchemas: (nodeSchemas) => set({ nodeSchemas }),

    fetchNodeSchemas: async () => {
      try {
        const response = await fetch("http://localhost:8000/nodes");
        const data = await response.json();
        console.log("node schemas:", data);
        set({ nodeSchemas: data });
      } catch (error) {
        console.error("Failed to fetch node schemas:", error);
      }
    },
  }),
  shallow,
);

// Selector hook to get node data at a specific path
// This creates a proper subscription that only re-renders when the specific data changes
export const useNodeData = (path: (string | number)[]) => {
  return useStore((state) => {
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

export default useStore;
