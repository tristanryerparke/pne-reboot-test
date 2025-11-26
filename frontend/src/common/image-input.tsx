import { memo, useRef, useState } from "react";
import { Input } from "../components/ui/input";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import type { FrontendFieldDataWrapper } from "@/types/types";

interface ImageInputProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function ImageInput({ path }: ImageInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState<string>("");

  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64.split(",")[1];

        // Upload to backend
        const response = await fetch("http://localhost:8000/image/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            img_base64: base64Data,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();

        // Update node data with all image data (cache_ref, width, height, mode, thumb_base64)
        updateNodeData([...path, "value"], {
          cache_ref: data.cache_ref,
          width: data.width,
          height: data.height,
          mode: data.mode,
          thumb_base64: data.thumb_base64,
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-0 min-w-full">
      <div className="relative">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isConnected || uploading}
          className="nodrag nopan h-9 w-full cursor-pointer file:cursor-pointer file:mr-0 overflow-hidden opacity-0 absolute inset-0"
        />
        <div className="flex h-9 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 py-1 items-center cursor-pointer">
          <span className="text-sm truncate">{filename || "Choose File"}</span>
        </div>
      </div>
      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading...</p>
      )}
    </div>
  );
});
