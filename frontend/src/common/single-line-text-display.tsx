import { cn } from "@/lib/utils";

interface SingleLineTextDisplayProps {
  content: React.ReactNode;
  dimmed?: boolean;
  disabled?: boolean;
}

export default function SingleLineTextDisplay({
  content,
  dimmed = false,
  disabled = false,
}: SingleLineTextDisplayProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-full min-w-20  rounded-md border dark:bg-input/30 px-2 py-1 text-base shadow-xs border-input overflow-hidden items-center",
        dimmed && "text-gray-400",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span className="truncate w-full text-sm">{content}</span>
    </div>
  );
}
