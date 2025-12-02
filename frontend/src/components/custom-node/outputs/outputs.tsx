import OutputFieldHandleWrapper from "./output-field-handle-wrapper";
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
    <div className="flex flex-col">
      {Object.entries(data.outputs).map(
        (
          [outputName, outputDef]: [string, FrontendFieldDataWrapper],
          index,
        ) => (
          <div key={outputName} className="flex-1">
            {index > 0 && <Separator className="w-full" />}
            <OutputFieldHandleWrapper
              fieldData={outputDef}
              path={[...path, "outputs", outputName]}
            />
          </div>
        ),
      )}
    </div>
  );
}
