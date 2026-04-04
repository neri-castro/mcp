import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import type { BruParser } from "../../bru/BruParser.js";
import type { BruSerializer } from "../../bru/BruSerializer.js";

/**
 * BaseFileRepository<T>
 * DRY base repository: read/write/delete/list filesystem files.
 * All domain repositories extend this, injecting the BruParser and BruSerializer.
 */
export abstract class BaseFileRepository<T> {
  constructor(
    protected readonly parser: BruParser,
    protected readonly serializer: BruSerializer
  ) {}

  async readFile(filePath: string): Promise<T> {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return this.parser.parse(raw) as T;
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        throw Object.assign(new Error(`FILE_NOT_FOUND: ${filePath}`), { code: "FILE_NOT_FOUND" });
      }
      throw err;
    }
  }

  async readRaw(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        throw Object.assign(new Error(`FILE_NOT_FOUND: ${filePath}`), { code: "FILE_NOT_FOUND" });
      }
      throw err;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  async listFiles(dirPath: string, pattern: string): Promise<string[]> {
    return glob(path.join(dirPath, pattern));
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  async readJson(filePath: string): Promise<Record<string, unknown>> {
    const raw = await this.readRaw(filePath);
    return JSON.parse(raw) as Record<string, unknown>;
  }

  async writeJson(filePath: string, data: unknown): Promise<void> {
    await this.writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
  }
}
