import type { EnvironmentRepository } from "../repositories/EnvironmentRepository.js";
import type { IEnvironmentManager } from "./interfaces.js";
import type {
  EnvironmentDTO,
  CreateEnvironmentDTO,
  UpdateEnvironmentDTO,
} from "../dto/environment/EnvironmentDTO.js";

/**
 * EnvironmentService — Orchestrates environment and variable management.
 * Tell Don't Ask: callers instruct the service; internal state logic stays here.
 */
export class EnvironmentService implements IEnvironmentManager {
  constructor(private readonly repo: EnvironmentRepository) {}

  async listEnvironments(collectionPath: string): Promise<string[]> {
    return this.repo.list(collectionPath);
  }

  async createEnvironment(dto: CreateEnvironmentDTO): Promise<EnvironmentDTO> {
    return this.repo.create(dto);
  }

  async getEnvironment(collectionPath: string, envName: string): Promise<EnvironmentDTO> {
    return this.repo.get(collectionPath, envName);
  }

  async updateEnvironment(
    collectionPath: string,
    envName: string,
    dto: UpdateEnvironmentDTO
  ): Promise<EnvironmentDTO> {
    return this.repo.update(collectionPath, envName, dto);
  }

  async deleteEnvironment(collectionPath: string, envName: string): Promise<void> {
    return this.repo.delete(collectionPath, envName);
  }

  async setVariable(
    collectionPath: string,
    envName: string,
    key: string,
    value: string,
    isSecret = false
  ): Promise<EnvironmentDTO> {
    return this.repo.setVar(collectionPath, envName, key, value, isSecret);
  }

  async removeVariable(collectionPath: string, envName: string, key: string): Promise<EnvironmentDTO> {
    return this.repo.removeVar(collectionPath, envName, key);
  }

  async markSecret(collectionPath: string, envName: string, keys: string[]): Promise<EnvironmentDTO> {
    return this.repo.markSecret(collectionPath, envName, keys);
  }

  /**
   * Interpolate {{var}} placeholders in a template string using the given vars map.
   * Implements: bru.interpolate() semantics.
   */
  interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  async getEnvTemplate(collectionPath: string): Promise<string> {
    return this.repo.generateEnvTemplate(collectionPath);
  }
}
