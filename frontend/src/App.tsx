import "./index.css";
import "@xyflow/react/dist/style.css";

import NodePicker from "./components/node-picker/node-picker";
import { ReactFlowProvider } from "@xyflow/react";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { Separator } from "./components/ui/separator";
import { TypesBrowser } from "./components/types-browser/types-browser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";

import NodeGraph from "./components/node-graph";
import ExecuteButton from "./components/execute-button";
import SaveButton from "./components/save-button";
import { LoadButton } from "./components/load-button";
import { useEffect } from "react";
import useTypesStore from "./stores/typesStore";
import useSchemasStore from "./stores/schemasStore";

function App() {
  const fetchTypes = useTypesStore((state) => state.fetchTypes);
  const fetchNodeSchemas = useSchemasStore((state) => state.fetchNodeSchemas);

  useEffect(() => {
    fetchTypes();
    fetchNodeSchemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ReactFlowProvider>
          <div className="min-h-full flex h-screen w-screen flex-row overflow-hidden bg-background text-foreground">
            <div className="min-w-60 flex flex-col h-full">
              <Tabs
                defaultValue="nodes"
                className="w-full gap-0 flex flex-col flex-1 overflow-hidden"
              >
                <div className="flex flex-row w-full px-2 pt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="nodes">Nodes</TabsTrigger>
                    <TabsTrigger value="types">Types</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="nodes" className="flex-1 overflow-hidden">
                  <NodePicker />
                </TabsContent>
                <TabsContent value="types" className="flex-1 overflow-hidden">
                  <TypesBrowser />
                </TabsContent>
              </Tabs>
              <Separator className="mt-auto" />
              <div className="w-full flex flex-row px-2 pt-2 gap-2">
                <ModeToggle />
                <ExecuteButton />
              </div>
              <div className="w-full flex flex-row p-2 gap-2">
                <SaveButton />
                <LoadButton />
              </div>
            </div>
            <Separator orientation="vertical" />
            <NodeGraph />
          </div>
        </ReactFlowProvider>
      </ThemeProvider>
    </>
  );
}

export { App };
