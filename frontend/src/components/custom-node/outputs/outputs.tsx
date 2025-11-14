import SingleOutputField from "./single-output-field";
import { Separator } from "../../ui/separator";

interface OutputsProps {
  data: any;
  path: string[];
}

export default function Outputs({ data, path }: OutputsProps) {
  return (
    <div>
      {Object.entries(data.outputs).map(([outputName, outputDef], index) => (
        <div key={outputName} className="node-field-output">
          {index > 0 && <Separator />}
          <SingleOutputField
            fieldData={outputDef}
            path={[...path, "outputs", outputName]}
          />
        </div>
      ))}
    </div>
  );
}
