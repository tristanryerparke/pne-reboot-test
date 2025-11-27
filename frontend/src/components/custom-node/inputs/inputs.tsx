import SingleInputField from "./single-input-field";
import { Separator } from "../../ui/separator";
import ListDynamicInputs from "./dynamic/list-dynamic-inputs";
import DictDynamicInputs from "./dynamic/dict-dynamic-inputs";
import type { FunctionSchema } from "../../../types/types";

interface InputsProps {
  functionData: FunctionSchema;
  nodeId: string;
  path: string[];
}

export default function Inputs({ functionData, nodeId, path }: InputsProps) {
  // console.log(functionData);

  // Sort arguments to maintain proper order:
  // 1. Named arguments (non-numeric) come first, in their original order
  // 2. Numbered arguments (from *args) come after, sorted numerically
  const sortedArguments = Object.entries(functionData.arguments || {}).sort(
    ([nameA], [nameB]) => {
      const isNumericA = /^\d+$/.test(nameA);
      const isNumericB = /^\d+$/.test(nameB);

      // If both are numeric, sort by number
      if (isNumericA && isNumericB) {
        return parseInt(nameA) - parseInt(nameB);
      }

      // Named arguments come before numeric ones
      if (!isNumericA && isNumericB) return -1;
      if (isNumericA && !isNumericB) return 1;

      // Both are named, maintain original order (stable sort)
      return 0;
    },
  );

  // Flag used for conditionally rendering the separator
  const hasExistingArguments =
    Object.keys(functionData.arguments || {}).length !== 0;

  return (
    <div className="w-full min-w-0">
      {sortedArguments.map(([argName, argData], index) => {
        return (
          <div key={argName} className="w-full">
            {index > 0 && <Separator className="w-full" />}
            <SingleInputField
              fieldData={argData}
              path={[...path, "arguments", argName]}
              nodeData={functionData}
            />
          </div>
        );
      })}
      {functionData.dynamicInputType?.structureType === "list" && (
        <>
          {hasExistingArguments && <Separator />}
          <ListDynamicInputs data={functionData} nodeId={nodeId} />
        </>
      )}
      {functionData.dynamicInputType?.structureType === "dict" && (
        <>
          {hasExistingArguments && <Separator />}
          <DictDynamicInputs data={functionData} nodeId={nodeId} />
        </>
      )}
    </div>
  );
}
