import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import NodePicker from "./node-picker/node-picker";
import TypesBrowser from "./types-browser/types-browser";
import { ModeToggle } from "../mode-toggle";
import ExecuteButton from "../execute-button";
import SaveButton from "../save-button";
import { LoadButton } from "../load-button";

export default function NodesTypesSidebar() {
  return (
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
  );
}
