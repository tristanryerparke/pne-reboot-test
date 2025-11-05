import { JsonViewer as BaseJsonViewer } from "../ui/json-tree-viewer";
import { useNodeData } from "../../store";

interface JsonViewerProps {
  path: (string | number)[];
}

export default function JsonViewer({ path }: JsonViewerProps) {
  const data = useNodeData(path);

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
