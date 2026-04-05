import { KeycloakErrorDTO } from '../dto/common/index.js';

export class KeycloakAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly kcError?: KeycloakErrorDTO
  ) {
    super(message);
    this.name = 'KeycloakAPIError';
  }
}

export class TokenRefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

export class DbInspectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DbInspectorError';
  }
}
