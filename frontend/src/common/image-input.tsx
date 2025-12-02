import { memo, useRef, useState, useEffect } from "react";
import useFlowStore from "../stores/flowStore";
import { useNodeConnections } from "@xyflow/react";
import type { FrontendFieldDataWrapper } from "@/types/types";

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
  const storedFilename = (inputData as any).filename;

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

        // Update node data with all image data (cacheKey, _preview, _width, _height, _mode, filename)
        // Preserve _expanded state if it exists
        updateNodeData(path, {
          type: data.type,
          cacheKey: data.cacheKey,
          _preview: data._preview,
          _size: data._size,
          _width: data._width,
          _height: data._height,
          _mode: data._mode,
          filename: data.filename,
          _expanded: inputData._expanded,
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

  // When connected, show as read-only display (like output)
  if (isConnected) {
    return (
      <div className="flex max-h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-2 py-1 items-center opacity-50 cursor-not-allowed">
        <span className="text-sm truncate">
          {hasImage ? "Generated Image" : "No image"}
        </span>
      </div>
    );
  }

  // When not connected, show file picker
  const displayText = storedFilename || "Choose File";

  return (
    <div className="flex flex-col gap-2 w-0 min-w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      <div
        className="flex max-h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-2 py-1 items-center cursor-pointer"
        onClick={() => {
          if (!uploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <span className="text-sm truncate">{displayText}</span>
      </div>
      {uploading && (
        <p className="text-xs text-muted-foreground">Uploading...</p>
      )}
    </div>
  );
});
