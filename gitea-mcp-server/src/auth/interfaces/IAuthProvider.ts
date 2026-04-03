// src/auth/interfaces/IAuthProvider.ts

export interface IAuthProvider {
  /**
   * Retorna los headers HTTP necesarios para autenticar una request.
   * Implementaciones: NativeAuthProvider, LDAPAuthProvider
   */
  getAuthHeaders(): Promise<Record<string, string>>;

  /**
   * Verifica si las credenciales son válidas realizando una llamada
   * de prueba a GET /api/v1/user
   */
  validate(): Promise<boolean>;

  /**
   * Retorna el tipo de autenticación para logging/diagnóstico
   */
  getType(): 'native' | 'ldap' | 'token' | 'oauth2';
}
