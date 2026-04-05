export interface TokenRequestDTO {
  grant_type: 'client_credentials' | 'password' | 'refresh_token';
  client_id: string;
  client_secret?: string;
  username?: string;
  password?: string;
  refresh_token?: string;
}

export interface TokenResponseDTO {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: 'Bearer';
  session_state: string;
  scope: string;
}

export interface TokenIntrospectResponseDTO {
  active: boolean;
  exp?: number;
  iat?: number;
  jti?: string;
  iss?: string;
  sub?: string;
  typ?: string;
  azp?: string;
  session_state?: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
}

export interface UserInfoResponseDTO {
  sub: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
}
