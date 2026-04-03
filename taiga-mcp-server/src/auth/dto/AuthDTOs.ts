export interface AuthRequestDTO {
  type: 'normal' | 'ldap';
  username: string;
  password: string;
}

export interface AuthResponseDTO {
  auth_token: string;
  refresh: string;
  id: number;
  username: string;
  full_name: string;
  email: string;
  is_active: boolean;
  photo: string | null;
  bio: string;
}

export interface TokenRefreshRequestDTO {
  refresh: string;
}

export interface TokenRefreshResponseDTO {
  auth_token: string;
}

export interface TokenState {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
}
