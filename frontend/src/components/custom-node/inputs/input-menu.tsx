import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

interface InputMenuProps {
  onDelete?: () => void;
  unionTypes?: string[];
  selectedType?: string;
  onTypeChange?: (type: string) => void;
}

export default function InputMenu({
  onDelete,
  unionTypes,
  selectedType,
  onTypeChange,
}: InputMenuProps) {
  const hasUnionTypes = unionTypes && unionTypes.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="mx-1 flex-shrink-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="right" sideOffset={5}>
        {hasUnionTypes && (
          <>
            <DropdownMenuLabel>Input Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={selectedType}
              onValueChange={onTypeChange}
            >
              {unionTypes.map((type) => (
                <DropdownMenuRadioItem key={type} value={type}>
                  {type}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {onDelete && <DropdownMenuSeparator />}
          </>
        )}
        {onDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={onDelete}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
