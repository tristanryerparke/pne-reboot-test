import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "@xyflow/react";
import { produce } from "immer";

// store for NodeGraph state using zustand
export type AppState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (path: (string | number)[], newData: unknown) => void;
  getNodeData: (path: (string | number)[]) => unknown;
};

const useStore = create<AppState>((set, get) => ({
  nodes: [], // initial state for nodes, used in NodeGraph
  edges: [], // initial state for edges, used in NodeGraph

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
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // Action to update node data at a specific path
  updateNodeData: (path, newData) => {
    set(
      produce((state: AppState) => {
        const nodeIndex = state.nodes.findIndex((node) => node.id === path[0]);
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

          // Get the old value before updating
          const finalKey = pathToProperty[pathToProperty.length - 1];
          const oldValue = current[finalKey];

          // Log the update
          console.log("updating ", path, "\n from", oldValue, "to", newData);

          // Update the property
          current[finalKey] = newData;
        }
      }),
    );
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
}));

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
