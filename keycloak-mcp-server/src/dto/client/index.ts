export interface ClientRepresentationDTO {
  id?: string;
  clientId: string;
  name?: string;
  description?: string;
  rootUrl?: string;
  adminUrl?: string;
  baseUrl?: string;
  enabled?: boolean;
  protocol?: 'openid-connect' | 'saml';
  publicClient?: boolean;
  bearerOnly?: boolean;
  standardFlowEnabled?: boolean;
  implicitFlowEnabled?: boolean;
  directAccessGrantsEnabled?: boolean;
  serviceAccountsEnabled?: boolean;
  authorizationServicesEnabled?: boolean;
  redirectUris?: string[];
  webOrigins?: string[];
  defaultClientScopes?: string[];
  optionalClientScopes?: string[];
  attributes?: Record<string, string>;
  secret?: string;
  nodeReRegistrationTimeout?: number;
}

export interface ProtocolMapperDTO {
  id?: string;
  name: string;
  protocol: 'openid-connect' | 'saml';
  protocolMapper: string;
  consentRequired?: boolean;
  config?: Record<string, string>;
}

export interface ClientSecretDTO {
  type: string;
  value: string;
}
