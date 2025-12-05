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
        "flex flex-1 w-0 overflow-x-auto overflow-y-hidden nowheel nodrag",
        "h-8 rounded-md border dark:bg-input/30 px-2 py-1 text-base shadow-xs border-input items-center",
        dimmed && "text-gray-400",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span className="whitespace-nowrap text-sm">{content}</span>
    </div>
  );
}
