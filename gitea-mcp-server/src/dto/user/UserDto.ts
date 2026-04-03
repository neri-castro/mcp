// src/dto/user/UserDto.ts

export interface CreateUserDto {
  login_name: string;
  email: string;
  password?: string;
  full_name?: string;
  must_change_password?: boolean;
  send_notify?: boolean;
  source_id?: number;
  login_name_source?: string;
  visibility?: 'public' | 'limited' | 'private';
  restricted?: boolean;
}

export interface AdminUpdateUserDto {
  email?: string;
  full_name?: string;
  password?: string;
  login_name?: string;
  source_id?: number;
  admin?: boolean;
  active?: boolean;
  restricted?: boolean;
  max_repo_creation?: number;
  allow_git_hook?: boolean;
  allow_import_local?: boolean;
  must_change_password?: boolean;
  prohibit_login?: boolean;
  visibility?: 'public' | 'limited' | 'private';
}

export interface UpdateUserSettingsDto {
  description?: string;
  diff_view_style?: string;
  full_name?: string;
  hide_activity?: boolean;
  hide_email?: boolean;
  language?: string;
  theme?: string;
  website?: string;
}

export interface AddSshKeyDto {
  key: string;
  title: string;
  read_only?: boolean;
}

export interface AddGpgKeyDto {
  armored_public_key: string;
  signature?: string;
}

export interface CreateOAuth2AppDto {
  name: string;
  redirect_uris: string[];
  confidential_client?: boolean;
}

export interface UpdateOAuth2AppDto {
  name: string;
  redirect_uris: string[];
  confidential_client?: boolean;
}

export interface CreateAccessTokenDto {
  name: string;
  scopes?: string[];
}

// src/dto/org/OrgDto.ts
export interface CreateOrgDto {
  username: string;
  visibility?: 'public' | 'limited' | 'private';
  description?: string;
  full_name?: string;
  location?: string;
  website?: string;
  repo_admin_change_team_access?: boolean;
}

export interface UpdateOrgDto {
  description?: string;
  full_name?: string;
  location?: string;
  visibility?: 'public' | 'limited' | 'private';
  website?: string;
  repo_admin_change_team_access?: boolean;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  includes_all_repositories?: boolean;
  permission?: 'none' | 'read' | 'write' | 'admin' | 'owner';
  units?: string[];
  units_map?: Record<string, string>;
}

export interface UpdateTeamDto {
  name: string;
  description?: string;
  includes_all_repositories?: boolean;
  permission?: 'none' | 'read' | 'write' | 'admin' | 'owner';
  units?: string[];
  units_map?: Record<string, string>;
}
