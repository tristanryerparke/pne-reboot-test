import { JsonViewer as BaseJsonViewer } from '../ui/json-tree-viewer';

interface JsonViewerProps {
  data: any;
  className?: string;
}

export default function JsonViewer({ data, className = '' }: JsonViewerProps) {
  return (
    <div className={`p-2 ${className}`}>
      <BaseJsonViewer
        className="w-full h-full"
        data={data}
        rootName="data"
        defaultExpanded={false}
      />
    </div>
  );
} 