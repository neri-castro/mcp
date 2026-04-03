// src/auth/NativeAuthProvider.ts

import type { IAuthProvider } from './interfaces/IAuthProvider.js';

export class NativeAuthProvider implements IAuthProvider {
  constructor(
    private readonly token?: string,
    private readonly username?: string,
    private readonly password?: string,
    private readonly totpCode?: string
  ) {}

  async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    } else if (this.username && this.password) {
      const encoded = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    if (this.totpCode) {
      headers['X-GITEA-OTP'] = this.totpCode;
    }

    return headers;
  }

  getType(): 'native' | 'ldap' | 'token' | 'oauth2' {
    return this.token ? 'token' : 'native';
  }

  async validate(): Promise<boolean> {
    // Implementado en GiteaHttpClient para evitar dependencia circular
    return true;
  }
}
