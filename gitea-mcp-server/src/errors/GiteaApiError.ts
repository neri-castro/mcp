// src/errors/GiteaApiError.ts

export class GiteaApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly details: string,
    public readonly endpoint: string
  ) {
    super(`Gitea API Error ${statusCode} on ${endpoint}: ${details}`);
    this.name = 'GiteaApiError';
  }

  get isNotFound() { return this.statusCode === 404; }
  get isUnauthorized() { return this.statusCode === 401; }
  get isForbidden() { return this.statusCode === 403; }
  get isValidationErr() { return this.statusCode === 422; }
  get isServerError() { return this.statusCode >= 500; }
}
