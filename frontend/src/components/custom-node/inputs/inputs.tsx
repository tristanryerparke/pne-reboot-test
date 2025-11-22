import SingleInputField from "./single-input-field";
import { Separator } from "../../ui/separator";
import ListDynamicInputs from "./dynamic/list-dynamic-inputs";
import DictDynamicInputs from "./dynamic/dict-dynamic-inputs";

interface InputsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  nodeId: string;
  path: string[];
}

export default function Inputs({ data, nodeId, path }: InputsProps) {
  // Sort arguments to maintain proper order:
  // 1. Named arguments (non-numeric) come first, in their original order
  // 2. Numbered arguments (from *args) come after, sorted numerically
  const sortedArguments = Object.entries(data.arguments).sort(
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

  const hasExistingArguments = Object.keys(data.arguments).length !== 0;

  return (
    <div className="w-fit min-w-full">
      {sortedArguments.map(([argName, argDef], index) => {
        return (
          <div key={argName} className="w-full">
            {index > 0 && <Separator className="w-full" />}
            <SingleInputField
              fieldData={argDef}
              path={[...path, "arguments", argName]}
              nodeData={data}
            />
          </div>
        );
      })}
      {data.dynamic_input_type?.structure_type === "list" && (
        <ListDynamicInputs
          data={data}
          nodeId={nodeId}
          hasExistingArguments={hasExistingArguments}
        />
      )}
      {data.dynamic_input_type?.structure_type === "dict" && (
        <DictDynamicInputs
          data={data}
          nodeId={nodeId}
          hasExistingArguments={hasExistingArguments}
        />
      )}
    </div>
  );
}
