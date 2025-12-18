import { CircleDashed, CircleAlert, CircleCheck } from "lucide-react";
import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type NodeStatusProps = {
  status: "not-executed" | "executed" | "error";
  onToggleDrawer?: () => void;
  hasTerminalOutput?: boolean;
  isDrawerOpen?: boolean;
};

export default memo(function NodeStatus({
  status,
  onToggleDrawer,
  hasTerminalOutput = false,
  isDrawerOpen = false,
}: NodeStatusProps) {
  let icon: React.ReactNode;
  let tooltipText: string;

  if (status === "not-executed") {
    icon = <CircleDashed className="w-4 h-4" />;
    tooltipText = "Not Executed";
  } else if (status === "error") {
    icon = <CircleAlert className="w-4 h-4 text-red-500" />;
    tooltipText = hasTerminalOutput ? "Error (traceback available)" : "Error";
  } else if (status === "executed") {
    icon = <CircleCheck className="w-4 h-4 text-green-500" />;
    tooltipText = hasTerminalOutput
      ? "Executed (terminal output available)"
      : "Executed";
  } else {
    return null;
  }

  const isClickable =
    (status === "error" || status === "executed") && hasTerminalOutput;

  const handleClick = () => {
    if (isClickable && onToggleDrawer) {
      onToggleDrawer();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            variant="ghost"
            size="icon"
            className={`nodrag relative h-6 w-6 ${!isClickable ? "cursor-default pointer-events-auto" : ""}`}
            disabled={!isClickable}
            asChild={!isClickable}
          >
            {!isClickable ? (
              <span>
                {icon}
                {hasTerminalOutput && !isDrawerOpen && (
                  <div className="absolute -top-[0.5px] -right-[0.5px] w-1.5 h-1.5 bg-orange-500 rounded-full" />
                )}
              </span>
            ) : (
              <>
                {icon}
                {hasTerminalOutput && !isDrawerOpen && (
                  <div className="absolute -top-[0.5px] -right-[0.5px] w-1.5 h-1.5 bg-orange-500 rounded-full" />
                )}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Status: {tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
