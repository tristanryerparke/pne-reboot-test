import NodePicker from './components/nodePicker/NodePicker';
import { ReactFlowProvider } from '@xyflow/react';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { Separator } from './components/ui/separator';

import NodeGraph from './components/node-graph';
// import ExecuteMenu from './components/execute-button';
// import SaveButton from './components/save-button';

import './index.css'
import '@xyflow/react/dist/style.css'

function App() {

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ReactFlowProvider>
          <div className="min-h-full flex h-screen w-screen flex-row overflow-hidden bg-background text-foreground">
            <div className="min-w-60 flex flex-col h-full">
              <NodePicker />
              <Separator className='mt-auto' />
              <div className='w-full flex flex-row p-2 gap-2'>
                {/* <ExecuteMenu />
                <SaveButton /> */}
                <ModeToggle />
              </div>
            </div>
            <Separator orientation="vertical" />
            <NodeGraph />
          </div>
        </ReactFlowProvider>
      </ThemeProvider>
    </>
  )
}

export { App };