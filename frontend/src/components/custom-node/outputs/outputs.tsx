import NodeOutputField from "./field-handle-wrapper";
import { Separator } from "../../ui/separator";
import type {
  FunctionSchema,
  FrontendFieldDataWrapper,
} from "../../../types/types";

interface OutputsProps {
  data: FunctionSchema;
  path: (string | number)[];
}

export default function Outputs({ data, path }: OutputsProps) {
  return (
    <div className="w-full min-w-0">
      {Object.entries(data.outputs).map(
        (
          [outputName, outputDef]: [string, FrontendFieldDataWrapper],
          index,
        ) => (
          <div key={outputName} className="w-full">
            {index > 0 && <Separator className="w-full" />}
            <NodeOutputField
              fieldData={outputDef}
              path={[...path, "outputs", outputName]}
            />
          </div>
        ),
      )}
    </div>
  );
}
