import path from "path";
import type { Config } from "../config/config.js";

/**
 * PathGuard — Security: ensures all file operations stay within allowed base paths.
 * Throws PATH_NOT_ALLOWED for paths outside configured boundaries.
 */
export function assertPathAllowed(targetPath: string, config: Config): void {
  const resolved = path.resolve(targetPath);
  const allowed = config.allowedBasePaths.some((base) =>
    resolved.startsWith(path.resolve(base))
  );
  if (!allowed) {
    throw Object.assign(
      new Error(`PATH_NOT_ALLOWED: "${resolved}" is outside allowed base paths.`),
      { code: "PATH_NOT_ALLOWED" }
    );
  }
}

export function resolveRequestFileName(name: string): string {
  return `${name.toLowerCase().replace(/[\s/\\]+/g, "-")}.bru`;
}

export function resolveEnvFileName(envName: string): string {
  return `${envName}.bru`;
}

export function collectionEnvsDir(collectionPath: string): string {
  return path.join(collectionPath, "environments");
}
