import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface InputMenuProps {
  isDynamic: boolean;
  onDelete?: () => void;
}

export default function InputMenu({ isDynamic, onDelete }: InputMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="mx-1 flex-shrink-0"
          disabled={!isDynamic}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      {isDynamic && (
        <DropdownMenuContent align="center" side="right" sideOffset={5}>
          <DropdownMenuItem
            variant="destructive"
            onClick={onDelete}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
