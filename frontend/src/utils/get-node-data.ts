import useStore from '../store';

// Function to get data at a specific path without updating
export function getNodeData(path: (string | number)[]) {
  // console.log(path)


  const nodes = useStore.getState().nodes;
  
  const nodeIndex = nodes.findIndex(node => node.id === path[0]);
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
}