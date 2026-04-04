import fs from "fs/promises";
import path from "path";
import type { EnvironmentRepository } from "../repositories/EnvironmentRepository.js";

/**
 * SecretService — Manages secret variable declarations and .gitignore/.env templates.
 * Git-safe, offline-first: values are never written to .bru files.
 */
export class SecretService {
  constructor(private readonly envRepo: EnvironmentRepository) {}

  async list(collectionPath: string, envName: string): Promise<string[]> {
    const env = await this.envRepo.get(collectionPath, envName);
    return env.secret_keys;
  }

  async add(collectionPath: string, envName: string, key: string): Promise<void> {
    await this.envRepo.markSecret(collectionPath, envName, [key]);
  }

  async remove(collectionPath: string, envName: string, key: string): Promise<void> {
    const env = await this.envRepo.get(collectionPath, envName);
    env.secret_keys = env.secret_keys.filter((k) => k !== key);
    const { BruSerializer } = await import("../bru/BruSerializer.js");
    const serializer = new BruSerializer();
    const content = serializer.serializeEnvironment(env.vars, env.secret_keys);
    await fs.writeFile(env.file_path, content, "utf-8");
  }

  async getEnvTemplate(collectionPath: string): Promise<string> {
    return this.envRepo.generateEnvTemplate(collectionPath);
  }

  async generateGitignore(collectionPath: string): Promise<string> {
    const gitignorePath = path.join(collectionPath, ".gitignore");
    const content = [
      "# Bruno secrets",
      ".env",
      "",
      "# Dependencies",
      "node_modules/",
      "",
      "# Reports",
      "reports/",
      "*.log",
      "",
      "# OS",
      ".DS_Store",
      "Thumbs.db",
    ].join("\n") + "\n";

    await fs.writeFile(gitignorePath, content, "utf-8");
    return content;
  }
}
