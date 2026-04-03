// src/dto/actions/ActionsDto.ts

export interface WorkflowDispatchDto {
  ref: string;
  inputs?: Record<string, string>;
}

export interface CreateCommitStatusDto {
  context?: string;
  description?: string;
  state: 'pending' | 'success' | 'error' | 'failure' | 'warning';
  target_url?: string;
}

export interface CreateSecretDto {
  data: string;
}

export interface CreateVariableDto {
  name: string;
  value: string;
}

export interface UpdateVariableDto {
  name?: string;
  value: string;
}
