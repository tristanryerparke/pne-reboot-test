import { Separator } from "../../../ui/separator";
import { Button } from "../../../ui/button";
import { Plus } from "lucide-react";
import useFlowStore from "../../../../stores/flowStore";

interface ListDynamicInputsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  nodeId: string;
  hasExistingArguments: boolean;
}

export default function ListDynamicInputs({
  data,
  nodeId,
  hasExistingArguments,
}: ListDynamicInputsProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleAddNumberedInput = () => {
    const argNames = Object.keys(data.arguments);
    const argNumbers = argNames
      .map((name) => {
        if (/^\d+$/.test(name)) {
          return parseInt(name);
        } else if (name.startsWith("_") && /^\d+$/.test(name.substring(1))) {
          return parseInt(name.substring(1));
        }
        return NaN;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = argNumbers.length > 0 ? Math.max(...argNumbers) + 1 : 0;
    const newArgName = `${nextNumber}`;

    const newArg = {
      type: data.dynamic_input_type?.items || data.arguments[argNames[0]]?.type,
      value: null,
    };

    updateNodeData([nodeId, "arguments", newArgName], newArg);
  };

  return (
    <div>
      {hasExistingArguments && <Separator />}
      <div className="p-2 py-1.5 flex flex-row gap-2 items-center">
        <Button variant="ghost" size="icon-xs" onClick={handleAddNumberedInput}>
          <Plus />
        </Button>
        Add Input
      </div>
    </div>
  );
}
