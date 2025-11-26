// eslint-disable react-refresh/only-export-components
import ImageOutput from "../../../common/image-output";

interface OutputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
}

type ComponentRegistryEntry = React.ComponentType<OutputRendererProps>;

// Add more output types here
export const OUTPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  ComponentRegistryEntry
> = {
  CachedImage: ImageOutput,
};
