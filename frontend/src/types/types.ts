export type BaseDataTypes = number | string;

export interface StructuredDataDescription {
  structure_type: "list" | "dict";
  items: string;
}

export interface FieldDataWrapper {
  type: string | StructuredDataDescription;
  value: BaseDataTypes | null;
}

export interface FunctionSchema {
  name: string;
  callable_id: string;
  category: string[];
  file_path: string;
  doc: string | null;
  arguments: Record<string, FieldDataWrapper>;
  dynamic_input_type: StructuredDataDescription | null;
  output_style: "single" | "multiple";
  outputs: Record<string, FieldDataWrapper>;
  auto_generated: boolean;
}
