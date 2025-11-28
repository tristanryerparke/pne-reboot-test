import "./index.css";
import "@xyflow/react/dist/style.css";

import { ReactFlowProvider } from "@xyflow/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Separator } from "./components/ui/separator";

import { ThemeProvider } from "./components/theme-provider";

import Inspector from "./components/inspector-sidebar/inspector";
import NodeGraph from "./components/node-graph";
import { useEffect } from "react";
import useTypesStore from "./stores/typesStore";
import useSchemasStore from "./stores/schemasStore";
import NodesTypesSidebar from "./components/node-types-sidebar/nodes-types-sidebar";

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
            <NodesTypesSidebar />
            <Separator orientation="vertical" />
            <PanelGroup direction="horizontal" autoSaveId="panel-width-save">
              <Panel id="node-graph" order={1}>
                <NodeGraph />
              </Panel>
              <PanelResizeHandle className="w-px bg-border" />
              <Panel
                id="inspector"
                order={2}
                defaultSize={25}
                minSize={20}
                maxSize={45}
              >
                <Inspector />
              </Panel>
            </PanelGroup>
          </div>
        </ReactFlowProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
