import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { NodeCategories, BaseNode } from '../../types/nodeTypes';
import { SearchBar } from './SearchBar';
import { CategoryGroup } from './CategoryGroup';

interface FunctionData {
  category: string[];
  arguments: Record<string, {
    type: string;
    default_value?: any;
  }>;
  return: {
    type: string;
  };
}

interface NodesResponse {
  [functionName: string]: FunctionData;
}

function NodePicker() {
  const { getNodes, setNodes, setEdges } = useReactFlow();
  const [nodeCategories, setNodeCategories] = useState<NodeCategories>({});
  const [searchTerm, setSearchTerm] = useState('');

  const transformFunctionDataToNodes = (data: NodesResponse): NodeCategories => {
    const categories: NodeCategories = {};
    
    Object.entries(data).forEach(([functionName, functionData]) => {
      // Use the first element of category array as the main category
      const mainCategory = functionData.category[0] || 'Uncategorized';
      // Use the second element as the group (file name)
      const group = functionData.category[1] || 'Default';
      
      // Create a BaseNode from the function data
      const baseNode: BaseNode = {
        data: {
          display_name: functionName,
          class_name: functionName,
          min_width: 200,
          // Include additional data that might be useful
          arguments: functionData.arguments,
          return_type: functionData.return.type,
          category: functionData.category
        },
        group: group
      };
      
      // Initialize category if it doesn't exist
      if (!categories[mainCategory]) {
        categories[mainCategory] = [];
      }
      
      categories[mainCategory].push(baseNode);
    });
    
    return categories;
  };

  const fetchNodes = useCallback(() => {
    fetch('http://localhost:8000/nodes')
      .then((response) => response.json())
      .then((data: NodesResponse) => {
        const transformedData = transformFunctionDataToNodes(data);
        setNodeCategories(transformedData);

        // Create a set of valid node types
        const validNodeTypes = new Set(
          Object.values(transformedData).flatMap(nodes => nodes.map(node => node.data.class_name))
        );

        // Filter out nodes that are no longer valid
        setNodes(nodes => nodes.filter(node => validNodeTypes.has(node.data.class_name as string)));

        // Remove edges connected to deleted nodes
        setEdges(edges => edges.filter(edge => 
          getNodes().some(node => node.id === edge.source) &&
          getNodes().some(node => node.id === edge.target)
        ));
      })
      .catch((error) => console.error('Error fetching node data:', error));
  }, [setNodeCategories, setNodes, setEdges, getNodes]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const filteredCategories = Object.entries(nodeCategories).reduce((acc, [category, nodes]) => {
    // Group nodes by their group attribute
    const groupedNodes = nodes.reduce((groups: Record<string, BaseNode[]>, node) => {
      const group = node.group || 'Ungrouped';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(node);
      return groups;
    }, {});

    // Filter nodes based on search term
    const filteredGroups: Record<string, BaseNode[]> = {};
    Object.entries(groupedNodes).forEach(([group, groupNodes]) => {
      const filteredNodes = groupNodes.filter(node => 
        node.data.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredNodes.length > 0) {
        filteredGroups[group] = filteredNodes;
      }
    });

    if (Object.keys(filteredGroups).length > 0 || category.toLowerCase().includes(searchTerm.toLowerCase())) {
      acc[category] = nodes.filter(node => 
        node.data.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      acc[category].groups = filteredGroups;
    }
    return acc;
  }, {} as NodeCategories & { [key: string]: { groups?: Record<string, BaseNode[]> } });

  return (
    <div className="overflow-x-scroll overflow-y-hidden flex flex-col p-2 gap-2">
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchNodes}
      />
      <div className="overflow-y-scroll flex flex-col justify-start items-start pb-1">
        {Object.entries(filteredCategories).map(([category, categoryData], index) => (
          <CategoryGroup 
            key={category}
            category={category}
            categoryData={categoryData}
            showDivider={index > 0}
          />
        ))}
      </div>
    </div>
  );
}

export default NodePicker;