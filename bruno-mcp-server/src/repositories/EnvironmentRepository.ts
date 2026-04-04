import path from "path";
import { BaseFileRepository } from "./base/BaseFileRepository.js";
import type { BruParser } from "../bru/BruParser.js";
import type { BruSerializer } from "../bru/BruSerializer.js";
import type {
  EnvironmentDTO,
  CreateEnvironmentDTO,
  UpdateEnvironmentDTO,
} from "../dto/environment/EnvironmentDTO.js";

export class EnvironmentRepository extends BaseFileRepository<Record<string, unknown>> {
  constructor(parser: BruParser, serializer: BruSerializer) {
    super(parser, serializer);
  }

  private envsDir(collectionPath: string): string {
    return path.join(collectionPath, "environments");
  }

  private envFilePath(collectionPath: string, envName: string): string {
    return path.join(this.envsDir(collectionPath), `${envName}.bru`);
  }

  async list(collectionPath: string): Promise<string[]> {
    const files = await this.listFiles(this.envsDir(collectionPath), "*.bru");
    return files.map((f) => path.basename(f, ".bru"));
  }

  async create(dto: CreateEnvironmentDTO): Promise<EnvironmentDTO> {
    const content = this.serializer.serializeEnvironment(dto.vars ?? {}, dto.secret_keys ?? []);
    const filePath = this.envFilePath(dto.collection_path, dto.env_name);
    await this.writeFile(filePath, content);
    return {
      name: dto.env_name,
      collection_path: dto.collection_path,
      file_path: filePath,
      vars: dto.vars ?? {},
      secret_keys: dto.secret_keys ?? [],
    };
  }

  async get(collectionPath: string, envName: string): Promise<EnvironmentDTO> {
    const filePath = this.envFilePath(collectionPath, envName);
    const raw = await this.readRaw(filePath);

    const vars: Record<string, string> = {};
    const secretKeys: string[] = [];

    // Parse vars block
    const varsMatch = raw.match(/^vars\s*\{([^}]*)\}/ms);
    if (varsMatch) {
      for (const line of varsMatch[1].split("\n")) {
        const m = line.match(/^\s*([^#\s][^:]*?)\s*:\s*(.+?)\s*$/);
        if (m) vars[m[1].trim()] = m[2].trim();
      }
    }

    // Parse vars:secret block
    const secretMatch = raw.match(/vars:secret\s*\[([^\]]*)\]/ms);
    if (secretMatch) {
      for (const line of secretMatch[1].split("\n")) {
        const key = line.replace(/,/g, "").trim();
        if (key) secretKeys.push(key);
      }
    }

    return { name: envName, collection_path: collectionPath, file_path: filePath, vars, secret_keys: secretKeys };
  }

  async update(collectionPath: string, envName: string, dto: UpdateEnvironmentDTO): Promise<EnvironmentDTO> {
    const current = await this.get(collectionPath, envName);
    const merged: EnvironmentDTO = {
      ...current,
      vars: { ...current.vars, ...(dto.vars ?? {}) },
      secret_keys: dto.secret_keys !== undefined ? dto.secret_keys : current.secret_keys,
    };
    const content = this.serializer.serializeEnvironment(merged.vars, merged.secret_keys);
    await this.writeFile(merged.file_path, content);
    return merged;
  }

  async delete(collectionPath: string, envName: string): Promise<void> {
    await this.deleteFile(this.envFilePath(collectionPath, envName));
  }

  async setVar(collectionPath: string, envName: string, key: string, value: string, isSecret = false): Promise<EnvironmentDTO> {
    const current = await this.get(collectionPath, envName);
    current.vars[key] = value;
    if (isSecret && !current.secret_keys.includes(key)) {
      current.secret_keys.push(key);
    }
    const content = this.serializer.serializeEnvironment(current.vars, current.secret_keys);
    await this.writeFile(current.file_path, content);
    return current;
  }

  async removeVar(collectionPath: string, envName: string, key: string): Promise<EnvironmentDTO> {
    const current = await this.get(collectionPath, envName);
    delete current.vars[key];
    current.secret_keys = current.secret_keys.filter((k) => k !== key);
    const content = this.serializer.serializeEnvironment(current.vars, current.secret_keys);
    await this.writeFile(current.file_path, content);
    return current;
  }

  async markSecret(collectionPath: string, envName: string, keys: string[]): Promise<EnvironmentDTO> {
    const current = await this.get(collectionPath, envName);
    for (const key of keys) {
      if (!current.secret_keys.includes(key)) {
        current.secret_keys.push(key);
      }
    }
    const content = this.serializer.serializeEnvironment(current.vars, current.secret_keys);
    await this.writeFile(current.file_path, content);
    return current;
  }

  async generateEnvTemplate(collectionPath: string): Promise<string> {
    const envNames = await this.list(collectionPath);
    const allSecrets = new Set<string>();
    for (const envName of envNames) {
      const env = await this.get(collectionPath, envName);
      env.secret_keys.forEach((k) => allSecrets.add(k));
    }
    return Array.from(allSecrets).map((k) => `${k.toUpperCase()}=`).join("\n") + "\n";
  }
}
