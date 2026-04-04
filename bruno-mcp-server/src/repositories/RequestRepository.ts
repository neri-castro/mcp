import path from "path";
import { BaseFileRepository } from "./base/BaseFileRepository.js";
import type { BruParser } from "../bru/BruParser.js";
import type { BruSerializer } from "../bru/BruSerializer.js";
import type {
  CreateRequestDTO,
  RequestResponseDTO,
  UpdateRequestDTO,
} from "../dto/request/RequestDTO.js";
import type { AuthConfigDTO } from "../dto/auth/AuthConfigDTO.js";
import type { AssertionDTO } from "../dto/test/AssertionDTO.js";

export class RequestRepository extends BaseFileRepository<Record<string, unknown>> {
  constructor(parser: BruParser, serializer: BruSerializer) {
    super(parser, serializer);
  }

  private resolveRequestPath(dto: CreateRequestDTO): string {
    const fileName = `${dto.name.toLowerCase().replace(/\s+/g, "-")}.bru`;
    if (dto.folder_path) {
      return path.join(dto.collection_path, dto.folder_path, fileName);
    }
    return path.join(dto.collection_path, fileName);
  }

  async create(dto: CreateRequestDTO): Promise<RequestResponseDTO> {
    const filePath = this.resolveRequestPath(dto);
    const content = this.serializer.serializeRequest(dto);
    await this.writeFile(filePath, content);
    return this.buildResponseDTO(filePath, dto, content);
  }

  async get(requestPath: string): Promise<RequestResponseDTO> {
    const raw = await this.readRaw(requestPath);
    const parsed = this.parser.parse(raw);
    return this.parsedToResponseDTO(requestPath, parsed, raw);
  }

  async list(folderPath: string): Promise<RequestResponseDTO[]> {
    const files = await this.listFiles(folderPath, "*.bru");
    const results: RequestResponseDTO[] = [];
    for (const f of files) {
      if (path.basename(f) !== "folder.bru") {
        results.push(await this.get(f));
      }
    }
    return results.sort((a, b) => a.seq - b.seq);
  }

  async update(requestPath: string, updates: UpdateRequestDTO): Promise<RequestResponseDTO> {
    const current = await this.get(requestPath);
    const name = path.basename(requestPath, ".bru");

    const merged: CreateRequestDTO = {
      collection_path: path.dirname(requestPath),
      name,
      method: (updates.method ?? current.method) as CreateRequestDTO["method"],
      url: updates.url ?? current.url,
      seq: updates.seq ?? current.seq,
      body_type: (updates.body_type ?? current.body_type) as CreateRequestDTO["body_type"],
      body: updates.body ?? (current.body as CreateRequestDTO["body"]),
      headers: updates.headers ?? current.headers,
      params_query: updates.params_query ?? Object.fromEntries(
        Object.entries(current.params_query).map(([k, v]) => [k, v.value])
      ),
      auth: updates.auth ?? current.auth,
      vars_pre: updates.vars_pre ?? current.vars_pre,
      vars_post: updates.vars_post ?? current.vars_post,
      assertions: updates.assertions ?? current.assertions,
      script_pre: updates.script_pre ?? current.script_pre,
      script_post: updates.script_post ?? current.script_post,
      tests: updates.tests ?? current.tests,
      docs: updates.docs ?? current.docs,
    };

    const content = this.serializer.serializeRequest(merged);
    await this.writeFile(requestPath, content);
    return this.get(requestPath);
  }

  async delete(requestPath: string): Promise<void> {
    await this.deleteFile(requestPath);
  }

  async clone(requestPath: string, newName: string, targetFolder: string): Promise<RequestResponseDTO> {
    const destPath = path.join(targetFolder, `${newName.toLowerCase().replace(/\s+/g, "-")}.bru`);
    await this.copyFile(requestPath, destPath);
    const current = await this.get(destPath);
    return this.update(destPath, { ...current, seq: (current.seq ?? 1) + 1 });
  }

  async setHeader(requestPath: string, key: string, value: string, enabled = true): Promise<RequestResponseDTO> {
    const current = await this.get(requestPath);
    const headers = { ...current.headers };
    if (enabled) {
      headers[key] = value;
    } else {
      headers[`~${key}`] = value;
      delete headers[key];
    }
    return this.update(requestPath, { headers });
  }

  async removeHeader(requestPath: string, key: string): Promise<RequestResponseDTO> {
    const current = await this.get(requestPath);
    const headers = { ...current.headers };
    delete headers[key];
    delete headers[`~${key}`];
    return this.update(requestPath, { headers });
  }

  async setQueryParam(requestPath: string, key: string, value: string, enabled = true): Promise<RequestResponseDTO> {
    const current = await this.get(requestPath);
    const params: Record<string, string> = Object.fromEntries(
      Object.entries(current.params_query).map(([k, v]) => [k, v.value])
    );
    if (enabled) {
      params[key] = value;
    } else {
      params[`~${key}`] = value;
    }
    return this.update(requestPath, { params_query: params });
  }

  async setDocs(requestPath: string, markdownContent: string): Promise<RequestResponseDTO> {
    return this.update(requestPath, { docs: markdownContent });
  }

  async reorder(folderPath: string, requestNamesOrdered: string[]): Promise<void> {
    for (let i = 0; i < requestNamesOrdered.length; i++) {
      const name = requestNamesOrdered[i];
      const filePath = path.join(folderPath, `${name.toLowerCase().replace(/\s+/g, "-")}.bru`);
      if (await this.exists(filePath)) {
        await this.update(filePath, { seq: i + 1 });
      }
    }
  }

  private buildResponseDTO(
    filePath: string,
    dto: CreateRequestDTO,
    rawBru: string
  ): RequestResponseDTO {
    return {
      file_path: filePath,
      name: dto.name,
      method: dto.method,
      url: dto.url,
      seq: dto.seq ?? 1,
      body_type: dto.body_type ?? "none",
      body: dto.body ?? null,
      headers: dto.headers ?? {},
      params_query: Object.fromEntries(
        Object.entries(dto.params_query ?? {}).map(([k, v]) => [k, { value: v, enabled: !k.startsWith("~") }])
      ),
      auth: dto.auth ?? { type: "none" },
      vars_pre: dto.vars_pre ?? {},
      vars_post: dto.vars_post ?? {},
      assertions: dto.assertions ?? [],
      script_pre: dto.script_pre ?? "",
      script_post: dto.script_post ?? "",
      tests: dto.tests ?? "",
      docs: dto.docs ?? "",
      raw_bru: rawBru,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parsedToResponseDTO(filePath: string, parsed: Record<string, unknown>, raw: string): RequestResponseDTO {
    const meta = (parsed["meta"] as Record<string, unknown>) ?? {};
    const name = (meta["name"] as string) ?? path.basename(filePath, ".bru");

    // Extract method from parsed
    const httpMethods = ["get", "post", "put", "patch", "delete", "options", "head"];
    let method = "GET";
    for (const m of httpMethods) {
      if (parsed[m]) {
        method = m.toUpperCase();
        break;
      }
    }

    const httpBlock = (parsed[method.toLowerCase()] as Record<string, unknown>) ?? {};

    return {
      file_path: filePath,
      name,
      method,
      url: (httpBlock["url"] as string) ?? "",
      seq: parseInt(meta["seq"] as string) || 1,
      body_type: (httpBlock["body"] as string) ?? "none",
      body: parsed["body"] ?? null,
      headers: (parsed["headers"] as Record<string, string>) ?? {},
      params_query: Object.fromEntries(
        Object.entries((parsed["query"] as Record<string, string>) ?? {}).map(([k, v]) => [
          k,
          { value: v as string, enabled: !k.startsWith("~") },
        ])
      ),
      auth: { type: ((httpBlock["auth"] as string) ?? "none") as AuthConfigDTO["type"] },
      vars_pre: (parsed["vars:pre-request"] as Record<string, string>) ?? {},
      vars_post: (parsed["vars:post-response"] as Record<string, string>) ?? {},
      assertions: (parsed["assert"] as AssertionDTO[]) ?? [],
      script_pre: (parsed["script:pre-request"] as string) ?? "",
      script_post: (parsed["script:post-response"] as string) ?? "",
      tests: (parsed["tests"] as string) ?? "",
      docs: (parsed["docs"] as string) ?? "",
      raw_bru: raw,
    };
  }
}
