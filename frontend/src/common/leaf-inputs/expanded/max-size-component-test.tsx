import SyncedResizable from "../../utility-components/synced-resizable";

const DEFAULT_AND_MIN_SIZE = {
  width: 240,
  height: 240,
};

const MAX_SIZE = {
  width: 800,
  height: 800,
};

interface GrowingComponentProps {
  path: (string | number)[];
}

export function GrowingComponent({ path }: GrowingComponentProps) {
  return (
    <SyncedResizable
      path={path}
      defaultSize={DEFAULT_AND_MIN_SIZE}
      minSize={DEFAULT_AND_MIN_SIZE}
      maxSize={MAX_SIZE}
    >
      <div className="bg-red-400 h-2000">growing component</div>
    </SyncedResizable>
  );
}
