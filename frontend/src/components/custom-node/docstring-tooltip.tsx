import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

interface NodeDocTooltipProps {
  description: string;
  children: React.ReactNode;
}

export function NodeDocTooltip({ description, children }: NodeDocTooltipProps) {
  return (
    <HoverCard openDelay={200} closeDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        sideOffset={4}
        className="w-fit p-2 text-xs rounded-sm max-w-md dark:bg-neutral-900"
      >
        <pre className="w-fit text-xs whitespace-pre-wrap">{description}</pre>
      </HoverCardContent>
    </HoverCard>
  );
}
