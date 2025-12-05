// eslint-disable react-refresh/only-export-components
import FloatInput from "../../../common/float-input";
import IntInput from "../../../common/int-input";
import StringInput from "../../../common/string-input";
import ImageInput from "../../../common/image-input";
import ImageExpanded from "../../../common/image-expanded";
import StringExpanded from "../../../common/string-expanded";

export interface InputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

export type ComponentRegistryEntry =
  | React.ComponentType<InputRendererProps>
  | {
      anyOf: React.ComponentType<InputRendererProps>[];
      expanded?: React.ComponentType<InputRendererProps>;
    }
  | {
      main: React.ComponentType<InputRendererProps>;
      expanded?: React.ComponentType<InputRendererProps>;
    };

// Add more input types here
export const TYPE_COMPONENT_REGISTRY: Record<string, ComponentRegistryEntry> = {
  float: { main: FloatInput },
  int: { main: IntInput },
  str: { main: StringInput, expanded: StringExpanded },
  Image: { main: ImageInput, expanded: ImageExpanded },
};
