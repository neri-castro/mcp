export interface CredentialRepresentationDTO {
  id?: string;
  type: 'password' | 'totp' | 'webauthn';
  value?: string;
  temporary?: boolean;
  device?: string;
}

export interface UserRepresentationDTO {
  id?: string;
  createdTimestamp?: number;
  username: string;
  enabled?: boolean;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  attributes?: Record<string, string[]>;
  disableableCredentialTypes?: string[];
  requiredActions?: string[];
  totp?: boolean;
  access?: {
    manageGroupMembership: boolean;
    view: boolean;
    mapRoles: boolean;
    impersonate: boolean;
    manage: boolean;
  };
  credentials?: CredentialRepresentationDTO[];
  federationLink?: string;
  serviceAccountClientId?: string;
  groups?: string[];
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
}

export interface CreateUserDTO {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  attributes?: Record<string, string[]>;
  requiredActions?: string[];
  credentials?: CredentialRepresentationDTO[];
  groups?: string[];
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {}

export interface UserSearchParamsDTO {
  search?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  enabled?: boolean;
  exact?: boolean;
  first?: number;
  max?: number;
  q?: string;
}

export interface PasswordDTO {
  type: 'password';
  value: string;
  temporary: boolean;
}

export interface ImpersonationResponseDTO {
  sameRealm?: boolean;
  redirect?: string;
}

export interface UserSessionRepresentationDTO {
  id: string;
  username: string;
  userId: string;
  ipAddress: string;
  start: number;
  lastAccess: number;
  rememberMe: boolean;
  clients: Record<string, string>;
}

export interface MappingsRepresentationDTO {
  realmMappings?: RoleRepresentationDTO[];
  clientMappings?: Record<string, ClientMappingsDTO>;
}

export interface ClientMappingsDTO {
  id: string;
  client: string;
  mappings: RoleRepresentationDTO[];
}

export interface RoleRepresentationDTO {
  id?: string;
  name: string;
  description?: string;
  composite?: boolean;
  composites?: {
    realm?: string[];
    client?: Record<string, string[]>;
  };
  clientRole?: boolean;
  containerId?: string;
  attributes?: Record<string, string[]>;
}
