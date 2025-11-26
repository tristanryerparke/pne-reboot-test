import { MoreVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import useFlowStore from "../../../stores/flowStore";
import type { FrontendFieldDataWrapper } from "../../../types/types";

// Types that have expandable preview areas
const TYPES_WITH_PREVIEW = ["CachedImage"];

interface OutputMenuProps {
  path?: (string | number)[];
  fieldData: FrontendFieldDataWrapper;
}

export default function OutputMenu({ path, fieldData }: OutputMenuProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Check if this type has a preview area
  const effectiveType = fieldData.type;
  const hasPreview =
    typeof effectiveType === "string" &&
    TYPES_WITH_PREVIEW.includes(effectiveType);
  const showPreview = fieldData._showPreview ?? false;

  const handleTogglePreview = () => {
    if (path) {
      updateNodeData([...path, "_showPreview"], !showPreview);
    }
  };

  // Don't show menu if there's nothing to configure
  if (!hasPreview) {
    return null;
  }

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
