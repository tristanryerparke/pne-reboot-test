import { JsonViewer as BaseJsonViewer } from '../ui/json-tree-viewer';
import { getNodeData } from "../../utils/get-node-data";

interface JsonViewerProps {
  path: (string | number)[];
}

export default function JsonViewer({ path }: JsonViewerProps) {

  const data = getNodeData(path)

  return (
    <div className={`p-2`}>
      <BaseJsonViewer
        className="w-full h-full"
        data={data}
        rootName="data"
        defaultExpanded={true}
      />
    </div>
  );
} 