export interface ScriptsConfig {
  moduleWhitelist?: string[];
  filesystemAccess?: { allow: boolean };
  flow?: "sandwich" | "sequential";
}

export interface CollectionPresetsConfig {
  requestType?: string;
  requestUrl?: string;
}

export interface CreateCollectionDTO {
  name: string;
  path: string;
  scripts_config?: ScriptsConfig;
  presets?: CollectionPresetsConfig;
  ignore?: string[];
}

export interface UpdateCollectionDTO {
  name?: string;
  scripts_config?: ScriptsConfig;
  presets?: CollectionPresetsConfig;
  ignore?: string[];
}

export interface CollectionDTO {
  name: string;
  path: string;
  bruno_json: Record<string, unknown>;
}

export interface CollectionSummaryDTO {
  name: string;
  path: string;
  request_count: number;
  folder_count: number;
  env_count: number;
}

export interface CollectionTreeNode {
  name: string;
  path: string;
  type: "folder" | "request";
  method?: string;
  seq?: number;
  children?: CollectionTreeNode[];
}

export interface CollectionTreeDTO {
  name: string;
  path: string;
  tree: CollectionTreeNode[];
}

export interface CreateFolderDTO {
  collection_path: string;
  folder_name: string;
  parent_path?: string;
}

export interface FolderConfigDTO {
  name: string;
  path: string;
  auth?: import("../auth/AuthConfigDTO.js").AuthConfigDTO;
  headers?: Record<string, string>;
  script_pre?: string;
  script_post?: string;
  vars?: Record<string, string>;
}
