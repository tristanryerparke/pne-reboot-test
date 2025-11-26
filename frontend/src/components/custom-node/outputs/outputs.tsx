import SingleOutputField from "./single-output-field";
import { Separator } from "../../ui/separator";
import type { FunctionSchema, FieldDataWrapper } from "../../../types/types";

interface OutputsProps {
  data: FunctionSchema;
  path: string[];
}

export default function Outputs({ data, path }: OutputsProps) {
  return (
    <div>
      {Object.entries(data.outputs).map(
        ([outputName, outputDef]: [string, FieldDataWrapper], index) => (
          <div key={outputName} className="node-field-output">
            {index > 0 && <Separator />}
            <SingleOutputField
              fieldData={outputDef}
              path={[...path, "outputs", outputName]}
            />
          </div>
        ),
      )}
    </div>
  );
}
