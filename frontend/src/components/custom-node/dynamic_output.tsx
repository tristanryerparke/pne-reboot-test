import { getNodeData } from "../../utils/get-node-data";

interface DynamicOutputProps {
  path: (string | number)[];
}

export default function DynamicOutput({ path }: DynamicOutputProps) {
  
  const fieldData = getNodeData(path) as { type: string; value?: any } | undefined;
  
  const displayValue = () => {
    if (fieldData?.value !== undefined) {
      // Handle different types of values
      if (typeof fieldData.value === 'object') {
        return JSON.stringify(fieldData.value);
      }
      return String(fieldData.value);
    }
    return  ''
  };
  
  return (
    <div className="flex h-9 w-full min-w-0 rounded-md border dark:bg-input/30 px-3 py-1 text-base shadow-xs border-input overflow-hidden items-center">
      <span className="text-sm text-muted-foreground truncate">
        {displayValue()}
      </span>
    </div>
  );
}