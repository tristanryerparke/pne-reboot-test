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
    <div className="flex flex-1 min-w-35 nodrag nopan nowheel">
      <span
        className={cn(
          "flex flex-1 w-0 text-sm",
          "h-8 rounded-md border dark:bg-input/30 px-2 py-1 shadow-xs border-input items-center",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn("truncate min-w-0 flex-1", dimmed && "text-gray-400")}
        >
          {content}
        </span>
      </span>
    </div>
  );
}
