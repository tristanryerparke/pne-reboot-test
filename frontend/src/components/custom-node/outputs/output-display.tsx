import OutputRenderer from "./output-renderer";
import OutputMenu from "./output-menu";
import type { FrontendFieldDataWrapper } from "../../../types/types";

interface OutputDisplayProps {
  fieldData: FrontendFieldDataWrapper;
  path: (string | number)[];
}

export default function OutputDisplay({ fieldData, path }: OutputDisplayProps) {
  const fieldName = path[path.length - 1];

  return (
    <div className="flex flex-col w-full gap-0.5">
      <div className="flex w-full items-center gap-1 h-8">
        <span className="shrink-0">{fieldName}</span>
        <span className="shrink-0">:</span>
        <div className="flex-1">
          <OutputRenderer outputData={fieldData} />
        </div>
        <OutputMenu path={path} fieldData={fieldData} />
      </div>
      {/*here is some extra output content*/}
    </div>
  );
}
