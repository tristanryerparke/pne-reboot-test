// eslint-disable react-refresh/only-export-components
import FloatInput from "../../../common/float-input";
import IntInput from "../../../common/int-input";
import StringInput from "../../../common/string-input";
import MultilineStringInput from "../../../common/multiline-string-input";

interface InputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

type ComponentRegistryEntry =
  | React.ComponentType<InputRendererProps>
  | { anyOf: React.ComponentType<InputRendererProps>[] };

// Add more input types here
export const TYPE_COMPONENT_REGISTRY: Record<string, ComponentRegistryEntry> = {
  float: FloatInput,
  int: IntInput,
  str: { anyOf: [StringInput, MultilineStringInput] },
};
