export interface BaseNodeData {
  name: string;
  display_name: string;
  category: string[];
  arguments: Record<string, { type: string; [key: string]: any }>;
  return: { type: string; [key: string]: any };
  min_width?: number;
  max_width?: number;
  inputs: InputField[];
  outputs: OutputField[];
}

export interface InputField {
  label: string;
  user_label?: string;
  type: string;
  value?: any;
  [key: string]: any;
}

export interface OutputField {
  label: string;
  user_label?: string;
  type: string;
  value?: any;
  [key: string]: any;
}

export interface NodeData {
  name: string;
  category: string[];
  arguments: Record<string, { type: string; [key: string]: any }>;
  return: { type: string; [key: string]: any };
} 