// src/auth/AuthManager.ts

import type { IAuthProvider } from './interfaces/IAuthProvider.js';
import { NativeAuthProvider } from './NativeAuthProvider.js';
import { LDAPAuthProvider } from './LDAPAuthProvider.js';

// Variable de entorno: GITEA_AUTH_TYPE = 'token' | 'native' | 'ldap'
export class AuthManager {
  static fromEnv(): IAuthProvider {
    const type = process.env.GITEA_AUTH_TYPE ?? 'token';

    switch (type) {
      case 'token':
        return new NativeAuthProvider(process.env.GITEA_TOKEN);

      case 'native':
        return new NativeAuthProvider(
          undefined,
          process.env.GITEA_USERNAME,
          process.env.GITEA_PASSWORD,
          process.env.GITEA_OTP
        );

      case 'ldap':
        if (!process.env.GITEA_LDAP_USERNAME || !process.env.GITEA_LDAP_PASSWORD) {
          throw new Error('GITEA_LDAP_USERNAME y GITEA_LDAP_PASSWORD son requeridos para auth type ldap');
        }
        return new LDAPAuthProvider(
          process.env.GITEA_LDAP_USERNAME,
          process.env.GITEA_LDAP_PASSWORD,
          process.env.GITEA_OTP
        );

      default:
        throw new Error(`Auth type '${type}' no reconocido. Use: token | native | ldap`);
    }
  }
}
