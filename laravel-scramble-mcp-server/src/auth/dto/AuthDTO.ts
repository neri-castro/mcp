// AuthConfigDTO.ts
export interface AuthConfigDTO {
  type: 'bearer' | 'apiKey' | 'basic' | 'oauth2';
  in?: 'header' | 'query' | 'cookie'; // para apiKey
  name?: string; // nombre del header/param
  bearerFormat?: 'JWT' | string;
  tokenUrl?: string; // para OAuth2
  authorizationUrl?: string; // para OAuth2
  scopes?: Record<string, string>; // para OAuth2
}

// AuthStateDTO.ts
export interface AuthStateDTO {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: 'Bearer' | 'Basic' | string;
}

// CredentialsDTO.ts
export interface CredentialsDTO {
  username?: string;
  password?: string;
  apiKey?: string;
  oauthCode?: string; // para authorization code flow
  clientId?: string;
  clientSecret?: string;
}
