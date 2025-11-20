/* eslint-disable react-refresh/only-export-components */
import FloatInput from "../../../common/float-input";
import IntInput from "../../../common/int-input";
import StringInput from "../../../common/string-input";

interface InputRendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputData: any;
  path: (string | number)[];
}

// Add more input types here
export const TYPE_COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<InputRendererProps>
> = {
  float: FloatInput,
  int: IntInput,
  str: StringInput,
};
