import type { ReactElement } from "react";
import useSelectorStore from "@/stores/selectorStore";
import { cn } from "@/lib/utils";

interface InspectableFieldWrapperProps {
  children: ReactElement<{ path: (string | number)[] }>;
  path: (string | number)[];
}

export default function InspectableFieldWrapper({
  children,
  path,
}: InspectableFieldWrapperProps) {
  const {
    isSelecting,
    selectTarget,
    selectedTarget,
    hoveredByInspector,
    clearSelectedTarget,
  } = useSelectorStore();

  const nodeId = path[0] as string;

  // Check if this field is currently selected in the inspector
  const isSelected =
    selectedTarget?.nodeId === nodeId &&
    JSON.stringify(selectedTarget?.path) === JSON.stringify(path);

  // Show red border when inspector toggle is hovered and this field is selected,
  // or when selector mode is active and this field is selected
  const showInspectorHoverBorder =
    (hoveredByInspector || isSelecting) && isSelected;

  const handleFieldClick = (e: React.MouseEvent) => {
    if (isSelecting) {
      // Only stop propagation/prevent default if we're actually in selector mode
      // This prevents interfering with tooltip hover events
      e.stopPropagation();
      e.preventDefault();

      // Shift+click to deselect (keeps selector mode active)
      if (e.shiftKey && isSelected) {
        clearSelectedTarget();
      } else {
        selectTarget(nodeId, path);
      }
    }
  };

  return (
    <div
      className={cn(
        "transition-all",
        isSelecting
          ? "cursor-pointer hover:ring-2 hover:ring-red-500 hover:rounded-sm"
          : null,
        showInspectorHoverBorder && "ring-2 ring-red-500 rounded",
      )}
      onClick={handleFieldClick}
    >
      <div className={cn(isSelecting ? "pointer-events-none" : null)}>
        {children}
      </div>
    </div>
  );
}
