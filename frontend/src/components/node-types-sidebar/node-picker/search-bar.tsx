import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { RefreshCw, Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  onRefresh,
}: SearchBarProps) {
  return (
    <div className="flex flex-row gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Search nodes..."
          className="pl-8"
          aria-label="Search nodes"
        />
      </div>
      <Button
        size="icon"
        variant="outline"
        onClick={onRefresh}
        title="Refresh functions"
        aria-label="Refresh functions"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
