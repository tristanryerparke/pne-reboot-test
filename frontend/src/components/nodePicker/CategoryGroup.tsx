import { BaseNode } from '../../types/nodeTypes';
import { Separator } from '../ui/separator';
import { DraggableNode } from './DraggableNode';

interface CategoryGroupProps {
  category: string;
  categoryData: {
    groups?: Record<string, BaseNode[]>;
  };
  showDivider: boolean;
}

export function CategoryGroup({ category, categoryData, showDivider }: CategoryGroupProps) {
  return (
    <div key={category} className="w-full flex flex-col pb-2">
      {showDivider && <Separator className="mb-2"/>}
      <div className="pb-1">
        <strong className="text-sm font-semibold text-foreground capitalize">
          {category.replace(/_/g, ' ')}
        </strong>
      </div>
      {categoryData.groups && Object.entries(categoryData.groups).map(([group, nodes]) => (
        <div key={`${category}-${group}`} className="flex flex-col pb-2 gap-1">
          <div className="flex flex-col flex-shrink">
            <i className="text-xs text-muted-foreground capitalize">
              {group.replace(/_/g, ' ')}
            </i>
          </div>
          <div className="flex flex-col gap-1">
            {nodes.map((node, index) => (
              <DraggableNode key={`${node.data.class_name}-${index}`} node={node} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 