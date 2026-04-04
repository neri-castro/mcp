export type AuthType =
  | "none"
  | "bearer"
  | "basic"
  | "apikey"
  | "oauth2"
  | "awsv4"
  | "digest"
  | "ntlm"
  | "wsse"
  | "inherit";

export type OAuth2GrantType =
  | "authorization_code"
  | "client_credentials"
  | "password"
  | "implicit";

export interface AuthConfigDTO {
  type: AuthType;
  // bearer
  token?: string;
  // basic / ntlm / wsse / digest
  username?: string;
  password?: string;
  // apikey
  key?: string;
  value?: string;
  placement?: "header" | "query";
  // oauth2
  grant_type?: OAuth2GrantType;
  client_id?: string;
  client_secret?: string;
  access_token_url?: string;
  authorization_url?: string;
  callback_url?: string;
  scope?: string;
  token_placement?: "header" | "url";
  token_header_prefix?: string;
  auto_fetch?: boolean;
  auto_refresh?: boolean;
  pkce?: boolean;
  // awsv4
  access_key_id?: string;
  secret_access_key?: string;
  region?: string;
  service?: string;
  session_token?: string;
  profile_name?: string;
  // ntlm
  domain?: string;
}
