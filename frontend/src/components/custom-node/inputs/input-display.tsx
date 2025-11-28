import InputRenderer from "./input-renderer";
import EditableKey from "./dynamic/editable-key";
import InputMenu from "./input-menu";
import { useNodeData } from "../../../stores/flowStore";
import type {
  FrontendFieldDataWrapper,
  StructDescr,
} from "../../../types/types";

interface InputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function InputDisplay({ fieldData, path }: InputDisplayProps) {
  const nodeId = path[0];
  const fieldName = path[path.length - 1];

  // Detect if this is a dynamic dict input as dict inputs have editable keys
  const dynamicInputType = useNodeData([nodeId, "dynamicInputType"]) as
    | StructDescr
    | null
    | undefined;
  const isDynamicDictInput =
    fieldData._structuredInputType === "dict" &&
    dynamicInputType?.structureType === "dict";
  const isEditableKey = isDynamicDictInput;

  return (
    <div className="flex flex-col w-full gap-0.5">
      <div className="flex w-full items-center gap-1 h-8">
        {isEditableKey ? (
          <EditableKey fieldName={fieldName} path={path} />
        ) : (
          <span className="shrink-0">{fieldName}</span>
        )}
        <span className="shrink-0">:</span>
        <div className="flex-1">
          <InputRenderer inputData={fieldData} path={path} />
        </div>
        <InputMenu path={path} fieldData={fieldData} />
      </div>
      {/*here is some extra input content*/}
    </div>
  );
}
