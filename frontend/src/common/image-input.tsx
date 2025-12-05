import { memo, useRef, useState, useEffect } from "react";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import { preserveUIData } from "../utils/preserve-ui-data";
import { Input } from "../components/ui/input";
import { cn } from "@/lib/utils";
import type { FrontendFieldDataWrapper } from "../types/types";

interface ImageInputProps {
  inputData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default memo(function ImageInput({ path, inputData }: ImageInputProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Check if cache key exists on mount (after page reload with persisted state)
  useEffect(() => {
    const cacheKey = (inputData as any).cacheKey;
    if (!cacheKey) return;

    // Verify the cache key still exists in the backend
    fetch(`http://localhost:8000/data/cache_exists/${cacheKey}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.exists) {
          // Clear the image data if cache key doesn't exist
          updateNodeData(path, {
            type: "Image",
            value: null,
            _expanded: inputData._expanded,
          });
        }
      })
      .catch((error) => {
        console.error("Error checking cache key:", error);
      });
  }, []); // Only run on mount

  // Use the xyflow hook to check if input is connected
  const handleId = `${path[0]}:${path[1]}:${path[2]}:handle`;
  const connections = useNodeConnections({
    handleType: "target",
    handleId: handleId,
  });

  // Determine if connected based on connections array
  const isConnected =
    connections.length > 0 && connections[0].targetHandle === handleId;

  // Check if there's image data
  const hasImage = !!(inputData as any).cacheKey;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64.split(",")[1];

        // Upload to backend
        const response = await fetch(
          "http://localhost:8000/data/upload_large_data",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "Image",
              filename: file.name,
              data: {
                img_base64: base64Data,
              },
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();

        // Preserve UI data from existing inputData, merge with all new data from backend
        const mergedData = preserveUIData(inputData as any, data);
        updateNodeData(path, mergedData);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const displayName = (inputData as any)._displayName || "Generated Image";

  // When connected, show as read-only display (like output)
  if (isConnected) {
    return (
      <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
        <span
          className={cn(
            "flex flex-1 w-0 text-sm",
            "h-8 rounded-md border dark:bg-input/30 px-2 py-1 shadow-xs border-input items-center",
            "opacity-50",
          )}
        >
          <span className="truncate min-w-0 flex-1">
            {hasImage ? displayName : "No image"}
          </span>
        </span>
      </div>
    );
  }

  // When not connected, show file picker
  const uploadText = (inputData as any)._displayName || "Upload Image";

  return (
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="min-w-20"
        placeholder=""
        hidden
      />
      <div
        className={cn(
          "flex flex-1 w-0 text-sm",
          "h-8 rounded-md border dark:bg-input/30 px-2 py-1 shadow-xs border-input items-center",
          uploading && "opacity-50",
          "cursor-pointer",
        )}
        onClick={() => {
          if (!uploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <span className="truncate min-w-0 flex-1">{uploadText}</span>
      </div>
      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading...</p>
      )}
    </div>
  );
});
