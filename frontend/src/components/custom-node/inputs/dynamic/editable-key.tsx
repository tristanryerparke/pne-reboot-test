import { useRef, useLayoutEffect, useState } from "react";
import {
  Editable,
  EditableArea,
  EditablePreview,
  EditableInput,
} from "../../../ui/editable";
import useFlowStore from "../../../../stores/flowStore";

interface EditableKeyProps {
  fieldName: string | number;
  path: (string | number)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeData: any;
}

export default function EditableKey({
  fieldName,
  path,
  nodeData,
}: EditableKeyProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (measureRef.current) {
      const width = measureRef.current.offsetWidth + 1;
      setTextWidth(width);
    }
  }, [fieldName]);

  const handleKeyChange = (newKey: string) => {
    if (!newKey || newKey === String(fieldName)) return;

    const argumentsPath = [...path.slice(0, -1)];
    const argumentsData = nodeData.arguments;

    if (argumentsData[newKey]) {
      console.warn(`Key "${newKey}" already exists`);
      return;
    }

    const newArguments = { ...argumentsData };
    newArguments[newKey] = newArguments[fieldName];
    delete newArguments[fieldName];

    updateNodeData(argumentsPath, newArguments);
  };

  return (
    <>
      <span
        ref={measureRef}
        className="invisible absolute border border-transparent px-1 py-0 shadow-xs text-base md:text-sm whitespace-nowrap"
        aria-hidden="true"
      >
        {fieldName}
      </span>
      <Editable
        value={String(fieldName)}
        onSubmit={handleKeyChange}
        placeholder="key"
        className="gap-0 shrink-0"
      >
        <EditableArea
          className="inline-block min-w-0 shrink-0"
          style={textWidth ? { width: `${textWidth}px` } : undefined}
        >
          <EditablePreview className="border border-transparent px-1 py-0 shadow-xs focus-visible:ring-0 text-base md:text-sm whitespace-nowrap" />
          <EditableInput className="border border-neutral-200 px-1 py-0 w-full" />
        </EditableArea>
      </Editable>
    </>
  );
}
