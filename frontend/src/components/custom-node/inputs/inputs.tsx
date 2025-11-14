import SingleInputField from "./single-input-field";
import { Separator } from "../../ui/separator";
import { Button } from "../../ui/button";
import { Plus } from "lucide-react";
import useFlowStore from "../../../stores/flowStore";

interface InputsProps {
  data: any;
  nodeId: string;
  path: string[];
}

export default function Inputs({ data, nodeId, path }: InputsProps) {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // For *args and **kwargs python functions we can add and remove inputs here on the frontend
  const handleAddInput = () => {
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
      type: data.list_inputs_type || data.arguments[argNames[0]]?.type,
      default_value: data.arguments[argNames[0]]?.default_value,
    };

    updateNodeData([nodeId, "arguments", newArgName], newArg);
  };

  const handleRemoveInput = (argName: string) => {
    const argNames = Object.keys(data.arguments);

    const numberedArgs = argNames
      .filter((name) => /^\d+$/.test(name))
      .map((name) => ({
        name,
        number: parseInt(name),
        data: data.arguments[name],
      }))
      .sort((a, b) => a.number - b.number);

    const removeIndex = numberedArgs.findIndex((arg) => arg.name === argName);
    if (removeIndex === -1) return;

    const newArguments = { ...data.arguments };
    delete newArguments[argName];

    for (let i = removeIndex + 1; i < numberedArgs.length; i++) {
      const oldName = numberedArgs[i].name;
      const newName = `${i - 1}`;

      newArguments[newName] = newArguments[oldName];

      if (oldName !== newName) {
        delete newArguments[oldName];
      }
    }

    updateNodeData([nodeId, "arguments"], newArguments);
  };

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
      type: data.dict_inputs_type || "str",
      _isDictInput: true,
    };

    updateNodeData([nodeId, "arguments", newArgName], newArg);
  };

  const handleRemoveDictInput = (argName: string) => {
    const newArguments = { ...data.arguments };
    delete newArguments[argName];

    updateNodeData([nodeId, "arguments"], newArguments);
  };

  const handleKeyNameChange = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    if (data.arguments[newKey]) {
      console.warn(`Key "${newKey}" already exists`);
      return;
    }

    const newArguments = { ...data.arguments };
    newArguments[newKey] = newArguments[oldKey];
    delete newArguments[oldKey];

    updateNodeData([nodeId, "arguments"], newArguments);
  };

  return (
    <div>
      {Object.entries(data.arguments).map(([argName, argDef], index) => {
        const isListInput = /^\d+$/.test(argName);
        const isListDynamic = isListInput && data.list_inputs === true;

        const isDictDynamic =
          (argDef as any)._isDictInput === true && data.dict_inputs === true;

        const isUnionType =
          typeof (argDef as any).type === "object" &&
          (argDef as any).type?.anyOf;
        const hasMenu = isListDynamic || isDictDynamic || isUnionType;

        return (
          <div key={argName} className="node-field-input">
            {index > 0 && <Separator />}
            <div className={`${!hasMenu ? "pr-2" : ""}`}>
              <SingleInputField
                fieldData={argDef}
                path={[...path, "arguments", argName]}
                showMenu={isListDynamic || isDictDynamic}
                onDelete={
                  isListDynamic
                    ? () => handleRemoveInput(argName)
                    : isDictDynamic
                      ? () => handleRemoveDictInput(argName)
                      : undefined
                }
                isEditableKey={isDictDynamic}
                onKeyChange={
                  isDictDynamic
                    ? (newKey) => handleKeyNameChange(argName, newKey)
                    : undefined
                }
              />
            </div>
          </div>
        );
      })}
      {data.list_inputs === true && (
        <div>
          {Object.keys(data.arguments).length !== 0 && <Separator />}
          <div className="p-2 py-1.5 flex flex-row gap-2 items-center">
            <Button variant="ghost" size="icon-xs" onClick={handleAddInput}>
              <Plus />
            </Button>
            Add Input
          </div>
        </div>
      )}
      {data.dict_inputs === true && (
        <div>
          {Object.keys(data.arguments).length !== 0 && <Separator />}
          <div className="p-2 py-1.5 flex flex-row gap-2 items-center text-sm">
            <Button variant="ghost" size="icon-xs" onClick={handleAddDictInput}>
              <Plus />
            </Button>
            Add Key / Value Input
          </div>
        </div>
      )}
    </div>
  );
}
