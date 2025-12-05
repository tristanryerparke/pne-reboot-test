import { Button } from "@/components/ui/button";
import useFlowStore from "../../stores/flowStore";
import { useReactFlow } from "@xyflow/react";
import { useRef } from "react";

export const LoadButton = () => {
  const { setNodes, setEdges, setViewport: setStoreViewport } = useFlowStore();
  const { setViewport } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const flow = JSON.parse(content);

        if (flow) {
          const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
          const viewport = { x, y, zoom };
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
          setStoreViewport(viewport);
          setViewport(viewport);
        }
      } catch (error) {
        console.error("Error loading flow:", error);
        alert("Failed to load flow. Please check the file format.");
      }
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button className="flex-1" onClick={onLoad} size="sm" variant="outline">
        Load
      </Button>
    </>
  );
};
