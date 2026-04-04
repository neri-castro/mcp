import type { RequestRepository } from "../repositories/RequestRepository.js";
import type {
  IRequestReader,
  IRequestWriter,
  IRequestHeaderManager,
  IAuthManager,
  IScriptManager,
  ITestManager,
} from "./interfaces.js";
import type { RequestResponseDTO, CreateRequestDTO, UpdateRequestDTO } from "../dto/request/RequestDTO.js";
import type { AuthConfigDTO } from "../dto/auth/AuthConfigDTO.js";
import type { AssertionDTO } from "../dto/test/AssertionDTO.js";

/**
 * RequestService — Orchestrates all .bru file operations.
 * Implements ISP: IRequestReader, IRequestWriter, IRequestHeaderManager,
 *                  IAuthManager, IScriptManager, ITestManager.
 */
export class RequestService
  implements
    IRequestReader,
    IRequestWriter,
    IRequestHeaderManager,
    IAuthManager,
    IScriptManager,
    ITestManager
{
  constructor(private readonly repo: RequestRepository) {}

  // ─── IRequestReader ──────────────────────────────────────────────────
  async getRequest(requestPath: string): Promise<RequestResponseDTO> {
    return this.repo.get(requestPath);
  }

  async listRequests(folderPath: string): Promise<RequestResponseDTO[]> {
    return this.repo.list(folderPath);
  }

  // ─── IRequestWriter ──────────────────────────────────────────────────
  async createRequest(dto: CreateRequestDTO): Promise<RequestResponseDTO> {
    return this.repo.create(dto);
  }

  async updateRequest(requestPath: string, dto: UpdateRequestDTO): Promise<RequestResponseDTO> {
    return this.repo.update(requestPath, dto);
  }

  async deleteRequest(requestPath: string): Promise<void> {
    return this.repo.delete(requestPath);
  }

  async cloneRequest(requestPath: string, newName: string, targetFolder: string): Promise<RequestResponseDTO> {
    return this.repo.clone(requestPath, newName, targetFolder);
  }

  // ─── IRequestHeaderManager ───────────────────────────────────────────
  async setHeader(requestPath: string, key: string, value: string, enabled = true): Promise<RequestResponseDTO> {
    return this.repo.setHeader(requestPath, key, value, enabled);
  }

  async removeHeader(requestPath: string, key: string): Promise<RequestResponseDTO> {
    return this.repo.removeHeader(requestPath, key);
  }

  async setQueryParam(requestPath: string, key: string, value: string, enabled = true): Promise<RequestResponseDTO> {
    return this.repo.setQueryParam(requestPath, key, value, enabled);
  }

  async setBody(requestPath: string, bodyType: string, body: unknown): Promise<RequestResponseDTO> {
    return this.repo.update(requestPath, {
      body_type: bodyType as CreateRequestDTO["body_type"],
      body: body as CreateRequestDTO["body"],
    });
  }

  async setDocs(requestPath: string, markdownContent: string): Promise<RequestResponseDTO> {
    return this.repo.setDocs(requestPath, markdownContent);
  }

  async reorder(folderPath: string, requestNamesOrdered: string[]): Promise<void> {
    return this.repo.reorder(folderPath, requestNamesOrdered);
  }

  // ─── IAuthManager ────────────────────────────────────────────────────
  async setAuth(targetPath: string, auth: AuthConfigDTO): Promise<void> {
    await this.repo.update(targetPath, { auth });
  }

  async getAuth(targetPath: string): Promise<AuthConfigDTO> {
    const req = await this.repo.get(targetPath);
    return req.auth;
  }

  // ─── IScriptManager ──────────────────────────────────────────────────
  async setPreRequestScript(targetPath: string, scriptJs: string): Promise<void> {
    await this.repo.update(targetPath, { script_pre: scriptJs });
  }

  async setPostResponseScript(targetPath: string, scriptJs: string): Promise<void> {
    await this.repo.update(targetPath, { script_post: scriptJs });
  }

  async getScripts(targetPath: string): Promise<{ pre: string; post: string }> {
    const req = await this.repo.get(targetPath);
    return { pre: req.script_pre, post: req.script_post };
  }

  async clearScript(targetPath: string, type: "pre" | "post"): Promise<void> {
    if (type === "pre") await this.repo.update(targetPath, { script_pre: "" });
    else await this.repo.update(targetPath, { script_post: "" });
  }

  validateScript(scriptJs: string): { valid: boolean; error?: string } {
    try {
      new Function(scriptJs); // Basic JS syntax check
      return { valid: true };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }

  // ─── ITestManager ────────────────────────────────────────────────────
  async addAssertion(requestPath: string, assertion: AssertionDTO): Promise<void> {
    const req = await this.repo.get(requestPath);
    const assertions = [...req.assertions, assertion];
    await this.repo.update(requestPath, { assertions });
  }

  async listAssertions(requestPath: string): Promise<AssertionDTO[]> {
    const req = await this.repo.get(requestPath);
    return req.assertions;
  }

  async removeAssertion(requestPath: string, index: number): Promise<void> {
    const req = await this.repo.get(requestPath);
    const assertions = req.assertions.filter((_, i) => i !== index);
    await this.repo.update(requestPath, { assertions });
  }

  async toggleAssertion(requestPath: string, index: number, enabled: boolean): Promise<void> {
    const req = await this.repo.get(requestPath);
    const assertions = req.assertions.map((a, i) => (i === index ? { ...a, enabled } : a));
    await this.repo.update(requestPath, { assertions });
  }

  async clearAssertions(requestPath: string): Promise<void> {
    await this.repo.update(requestPath, { assertions: [] });
  }

  async setTests(requestPath: string, testsJs: string): Promise<void> {
    await this.repo.update(requestPath, { tests: testsJs });
  }

  async getTests(requestPath: string): Promise<string> {
    const req = await this.repo.get(requestPath);
    return req.tests;
  }

  async clearTests(requestPath: string): Promise<void> {
    await this.repo.update(requestPath, { tests: "" });
  }

  validateTestSyntax(testsJs: string): { valid: boolean; error?: string } {
    return this.validateScript(testsJs);
  }
}
