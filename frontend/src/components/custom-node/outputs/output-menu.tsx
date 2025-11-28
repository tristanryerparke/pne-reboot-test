import { MoreVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import useFlowStore from "../../../stores/flowStore";
import type {
  FrontendFieldDataWrapper,
  ImageData,
  BaseDataTypes,
} from "../../../types/types";

// Type guard for ImageData
function isImageData(value: BaseDataTypes | null): value is ImageData {
  return (
    value !== null &&
    typeof value === "object" &&
    "cache_ref" in value &&
    "thumb_base64" in value
  );
}

interface OutputMenuProps {
  path: (string | number)[];
  fieldData: FrontendFieldDataWrapper;
}

export default function OutputMenu({ path, fieldData }: OutputMenuProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Check if this type has a preview area
  const hasPreview = "preview" in fieldData;

  // Check if image data has been uploaded
  const hasImageData = hasPreview && isImageData(fieldData.value);

  // Return null if there's nothing to show in the menu
  if (!hasImageData) {
    return null;
  }

  const showPreview = fieldData._showPreview ?? false;

  const handleTogglePreview = () => {
    updateNodeData([...path, "_showPreview"], !showPreview);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="left" sideOffset={5}>
        <DropdownMenuItem
          onClick={handleTogglePreview}
          className="cursor-pointer"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Preview
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
