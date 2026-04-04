export interface EnvironmentVarDTO {
  key: string;
  value: string;
  is_secret: boolean;
}

export interface EnvironmentDTO {
  name: string;
  collection_path: string;
  file_path: string;
  vars: Record<string, string>;
  secret_keys: string[];
}

export interface CreateEnvironmentDTO {
  collection_path: string;
  env_name: string;
  vars?: Record<string, string>;
  secret_keys?: string[];
}

export interface UpdateEnvironmentDTO {
  vars?: Record<string, string>;
  secret_keys?: string[];
}
