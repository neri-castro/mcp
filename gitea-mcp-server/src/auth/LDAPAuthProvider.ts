// src/auth/LDAPAuthProvider.ts

import type { IAuthProvider } from './interfaces/IAuthProvider.js';

/**
 * Para usuarios LDAP, Gitea acepta sus credenciales de directorio
 * via Basic Auth estándar. El servidor Gitea resuelve la autenticación
 * contra LDAP de forma transparente.
 *
 * Modos LDAP soportados (configurados en el servidor Gitea, no aquí):
 * - LDAP via BindDN: Recomendado para Active Directory / OpenLDAP
 * - LDAP Simple Auth: Para entornos sin restricciones de bind anónimo
 */
export class LDAPAuthProvider implements IAuthProvider {
  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly totpCode?: string
  ) {}

  async getAuthHeaders(): Promise<Record<string, string>> {
    const encoded = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    const headers: Record<string, string> = {
      'Authorization': `Basic ${encoded}`,
    };

    if (this.totpCode) {
      headers['X-GITEA-OTP'] = this.totpCode;
    }

    return headers;
  }

  getType(): 'native' | 'ldap' | 'token' | 'oauth2' {
    return 'ldap';
  }

  async validate(): Promise<boolean> {
    return true;
  }
}
