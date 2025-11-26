import { Separator } from "../../../ui/separator";
import { Button } from "../../../ui/button";
import { Plus } from "lucide-react";
import useFlowStore from "../../../../stores/flowStore";

interface DictDynamicInputsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  nodeId: string;
  hasExistingArguments: boolean;
}

export default function DictDynamicInputs({
  data,
  nodeId,
  hasExistingArguments,
}: DictDynamicInputsProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  const handleAddDictInput = () => {
    const argNames = Object.keys(data.arguments);
    const keyPattern = /^key_(\d+)$/;
    const keyNumbers = argNames
      .map((name) => {
        const match = name.match(keyPattern);
        return match ? parseInt(match[1]) : NaN;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = keyNumbers.length > 0 ? Math.max(...keyNumbers) + 1 : 0;
    const newArgName = `key_${nextNumber}`;

    const newArg = {
      type: data.dynamicInputType?.items || "str",
      _isDictInput: true,
    };

    updateNodeData([nodeId, "arguments", newArgName], newArg);
  };

  return (
    <div>
      {hasExistingArguments && <Separator />}
      <div className="p-2 py-1.5 flex flex-row gap-2 items-center text-sm">
        <Button variant="ghost" size="icon-xs" onClick={handleAddDictInput}>
          <Plus />
        </Button>
        Add Key / Value Input
      </div>
    </div>
  );
}
