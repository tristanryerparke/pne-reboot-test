import { CircleDashed, CircleAlert, CircleCheck } from "lucide-react";
import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NodeStatusProps = {
  status: "not-executed" | "executed" | "error";
  onToggleDrawer?: () => void;
};

export default memo(function NodeStatus({
  status,
  onToggleDrawer,
}: NodeStatusProps) {
  let icon: React.ReactNode;
  let tooltipText: string;

  if (status === "not-executed") {
    icon = <CircleDashed className="w-4 h-4 text-gray-400" />;
    tooltipText = "Not Executed";
  } else if (status === "error") {
    icon = <CircleAlert className="w-4 h-4 text-red-500" />;
    tooltipText = "Error";
  } else if (status === "executed") {
    icon = <CircleCheck className="w-4 h-4 text-green-500" />;
    tooltipText = "Executed";
  } else {
    return null;
  }

  const handleClick = () => {
    if (status === "error" && onToggleDrawer) {
      onToggleDrawer();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={handleClick}
            className={status === "error" ? "cursor-pointer" : ""}
          >
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
