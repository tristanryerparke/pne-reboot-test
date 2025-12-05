// eslint-disable react-refresh/only-export-components
import ImageOutput from "../../../common/image-output";
import ImageExpanded from "../../../common/image-expanded";
import StringOutput from "../../../common/string-output";
import StringExpanded from "../../../common/string-expanded";

export interface OutputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputData: any;
  path: (string | number)[];
  readOnly?: boolean;
}

export type OutputComponentRegistryEntry =
  | React.ComponentType<OutputRendererProps>
  | {
      main: React.ComponentType<OutputRendererProps>;
      expanded?: React.ComponentType<OutputRendererProps>;
      hideMainWhenExpanded?: boolean;
    };

// Add more output types here
export const OUTPUT_TYPE_COMPONENT_REGISTRY: Record<
  string,
  OutputComponentRegistryEntry
> = {
  Image: {
    main: ImageOutput,
    expanded: ImageExpanded,
  },
  str: {
    main: StringOutput,
    expanded: StringExpanded,
    hideMainWhenExpanded: true,
  },
};
