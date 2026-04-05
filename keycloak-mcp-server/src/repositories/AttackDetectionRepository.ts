import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export interface BruteForceStatusDTO {
  numTemporaryLockouts: number;
  disabled: boolean;
  lastIPFailure: string;
  lastFailure: number;
  failedLoginNotBefore: number;
  numFailures: number;
}

export class AttackDetectionRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async getUserStatus(userId: string): Promise<BruteForceStatusDTO> {
    return this.client.get(
      `/admin/realms/${this.realm}/attack-detection/brute-force/users/${userId}`,
      undefined,
      this.realm
    );
  }

  async clearUser(userId: string): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/attack-detection/brute-force/users/${userId}`,
      undefined,
      this.realm
    );
  }

  async clearAll(): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/attack-detection/brute-force/users`,
      undefined,
      this.realm
    );
  }
}
