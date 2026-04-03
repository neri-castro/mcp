// src/dto/repo/CreateRepoDto.ts
export interface CreateRepoDto {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
  gitignores?: string;
  license?: string;
  readme?: string;
  default_branch?: string;
  trust_model?: 'default' | 'collaborator' | 'committer' | 'collaboratorcommitter';
  is_template?: boolean;
}

// src/dto/repo/UpdateRepoDto.ts
export interface UpdateRepoDto {
  name?: string;
  description?: string;
  website?: string;
  private?: boolean;
  has_issues?: boolean;
  has_wiki?: boolean;
  has_pull_requests?: boolean;
  has_projects?: boolean;
  default_branch?: string;
  archived?: boolean;
  allow_merge_commits?: boolean;
  allow_rebase?: boolean;
  allow_rebase_explicit?: boolean;
  allow_squash_merge?: boolean;
  default_merge_style?: 'merge' | 'rebase' | 'rebase-merge' | 'squash';
  delete_branch_on_merge?: boolean;
}

export interface TransferRepoDto {
  new_owner: string;
  team_ids?: number[];
}

export interface ForkRepoDto {
  organization?: string;
  name?: string;
}

export interface CreateBranchDto {
  new_branch_name: string;
  old_branch_name?: string;
  old_sha?: string;
}

export interface CreateTagDto {
  tag_name: string;
  message?: string;
  target?: string;
}

export interface CreateReleaseDto {
  tag_name: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  target_commitish?: string;
}

export interface UpdateReleaseDto {
  tag_name?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
}

export interface FileOperationDto {
  message: string;
  content: string; // base64
  sha?: string;
  branch?: string;
  author?: { name: string; email: string };
  committer?: { name: string; email: string };
}

export interface DeleteFileDto {
  message: string;
  sha: string;
  branch?: string;
}

export interface AddCollaboratorDto {
  permission?: 'read' | 'write' | 'admin' | 'owner' | 'team';
}

export interface CreateHookDto {
  type: 'gitea' | 'slack' | 'discord' | 'telegram' | 'msteams' | 'feishu' | 'wechatwork' | 'packagist';
  config: Record<string, string>;
  events?: string[];
  active?: boolean;
  branch_filter?: string;
}

export interface UpdateHookDto {
  config?: Record<string, string>;
  events?: string[];
  active?: boolean;
  branch_filter?: string;
}

export interface CreateBranchProtectionDto {
  rule_name: string;
  require_signed_commits?: boolean;
  protected_file_patterns?: string;
  unprotected_file_patterns?: string;
  enable_push?: boolean;
  enable_push_whitelist?: boolean;
  push_whitelist_usernames?: string[];
  push_whitelist_teams?: string[];
  push_whitelist_deploy_keys?: boolean;
  enable_merge_whitelist?: boolean;
  merge_whitelist_usernames?: string[];
  merge_whitelist_teams?: string[];
  enable_status_check?: boolean;
  status_check_contexts?: string[];
  required_approvals?: number;
  enable_approvals_whitelist?: boolean;
  approvals_whitelist_usernames?: string[];
  approvals_whitelist_teams?: string[];
  block_on_rejected_reviews?: boolean;
  block_on_official_review_requests?: boolean;
  block_on_outdated_branch?: boolean;
  dismiss_stale_approvals?: boolean;
  require_code_owner_approval?: boolean;
  ignore_stale_approvals?: boolean;
}

export interface RepoFromTemplateDto {
  owner: string;
  name: string;
  description?: string;
  private?: boolean;
  git_content?: boolean;
  git_hooks?: boolean;
  webhooks?: boolean;
  topics?: boolean;
  avatar?: boolean;
  labels?: boolean;
}
