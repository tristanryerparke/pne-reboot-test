import { memo, useState, useRef, useEffect } from "react";
import NodeHeader from "./node-header";
import InputFieldComponent from "./input-field";
import OutputFieldComponent from "./output-field";
import JsonViewer from "./json-viewer";
import InputMenu from "./input-menu";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import useFlowStore from "../../stores/flowStore";

export default memo(function CustomNode({
  data,
  id,
}: {
  data: any;
  id: string;
}) {
  const [isJsonView, setIsJsonView] = useState(false);
  const [isResized, setIsResized] = useState(false);
  const [fitWidth, setFitWidth] = useState<number | undefined>(undefined);
  const nodeRef = useRef<HTMLDivElement>(null);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

  // Measure the fit width when not resized
  useEffect(() => {
    if (!isResized && nodeRef.current) {
      const width = nodeRef.current.offsetWidth;
      setFitWidth(width);
    }
  }, [isResized, isJsonView]);

  const toggleView = () => setIsJsonView(!isJsonView);

  const handleResizeStart = () => {
    if (nodeRef.current && !fitWidth) {
      setFitWidth(nodeRef.current.offsetWidth);
    }
    setIsResized(true);
  };

  const handleAddInput = () => {
    // Find the highest numbered argument (e.g., _0, _1, _2 or 0, 1, 2)
    const argNames = Object.keys(data.arguments);
    const argNumbers = argNames
      .map((name) => {
        // Handle both "0", "1" and "_0", "_1" patterns
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

    // Use list_inputs_type if available, otherwise fall back to first argument
    const newArg = {
      type: data.list_inputs_type || data.arguments[argNames[0]]?.type,
      default_value: data.arguments[argNames[0]]?.default_value,
    };

    // Update the node data with the new argument
    updateNodeData([id, "arguments", newArgName], newArg);
  };

  const handleRemoveInput = (argName: string) => {
    const argNames = Object.keys(data.arguments);

    // Get all numbered arguments and sort them
    const numberedArgs = argNames
      .filter((name) => /^\d+$/.test(name))
      .map((name) => ({
        name,
        number: parseInt(name),
        data: data.arguments[name],
      }))
      .sort((a, b) => a.number - b.number);

    // Find the index of the argument to remove
    const removeIndex = numberedArgs.findIndex((arg) => arg.name === argName);
    if (removeIndex === -1) return;

    // Create new arguments object without the removed item
    const newArguments = { ...data.arguments };
    delete newArguments[argName];

    // Renumber all arguments after the removed one
    for (let i = removeIndex + 1; i < numberedArgs.length; i++) {
      const oldName = numberedArgs[i].name;
      const newName = `${i - 1}`;

      // Copy the data to the new key
      newArguments[newName] = newArguments[oldName];

      // Delete the old key if it's different
      if (oldName !== newName) {
        delete newArguments[oldName];
      }
    }

    // Update the entire arguments object
    updateNodeData([id, "arguments"], newArguments);
  };

  const path = [id];

  // console.log(data);

  return (
    <div
      ref={nodeRef}
      className={`${
        isResized
          ? "relative h-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground"
          : "relative w-fit h-fit shadow-md border border-input rounded-lg bg-background text-secondary-foreground"
      }`}
      style={{
        maxHeight: "fit-content",
        overflowY: "visible",
        resize: "horizontal",
      }}
    >
      <NodeHeader
        data={data}
        nodeId={id}
        isJsonView={isJsonView}
        onToggleView={toggleView}
        onResizeStart={handleResizeStart}
        minWidth={fitWidth}
      />
      <Separator />
      {isJsonView ? (
        <JsonViewer data={data} path={[id]} />
      ) : (
        <>
          <div>
            {Object.entries(data.arguments).map(([argName, argDef], index) => {
              // Check if this is a user-added input (numeric key)
              const isUserAdded = /^\d+$/.test(argName);
              const isDynamic = isUserAdded && data.list_inputs === true;

              return (
                <div key={argName} className="node-field-input">
                  {index > 0 && <Separator />}
                  <div
                    className={`flex items-center ${!isDynamic ? "pr-2" : ""}`}
                  >
                    <div className="flex-1">
                      <InputFieldComponent
                        fieldData={argDef}
                        path={[...path, "arguments", argName]}
                      />
                    </div>
                    {isDynamic && (
                      <InputMenu onDelete={() => handleRemoveInput(argName)} />
                    )}
                  </div>
                </div>
              );
            })}
            {data.list_inputs === true && (
              <div>
                {Object.keys(data.arguments).length !== 0 && <Separator />}
                <div className="p-2 py-1.5 flex flex-row gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleAddInput}
                  >
                    <Plus />
                  </Button>
                  Add Input
                </div>
              </div>
            )}
          </div>
          {/* Handle both single and multiple outputs */}
          <Separator />
          <div>
            {Object.entries(data.outputs).map(
              ([outputName, outputDef], index) => (
                <div key={outputName} className="node-field-output">
                  {index > 0 && <Separator />}
                  <OutputFieldComponent
                    fieldData={outputDef}
                    path={[...path, "outputs", outputName]}
                  />
                </div>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
});
