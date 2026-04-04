import type { CreateRequestDTO, HttpMethod, BodyType } from "../dto/request/RequestDTO.js";
import type { AuthConfigDTO } from "../dto/auth/AuthConfigDTO.js";
import type { AssertionDTO } from "../dto/test/AssertionDTO.js";

/**
 * BruSerializer — Centralized serialization to Bru Lang format.
 * Single Responsibility: convert structured DTOs → .bru text.
 */
export class BruSerializer {
  serializeRequest(dto: CreateRequestDTO, rawOverride?: Record<string, unknown>): string {
    const data = rawOverride ?? {};
    const name = dto.name;
    const method = (dto.method ?? (data as Record<string, string>)["method"] ?? "GET").toLowerCase();
    const url = dto.url ?? "";
    const bodyType = dto.body_type ?? "none";
    const authType = dto.auth?.type ?? "none";
    const seq = dto.seq ?? 1;

    const lines: string[] = [];

    // meta block
    lines.push(`meta {`);
    lines.push(`  name: ${name}`);
    lines.push(`  type: http`);
    lines.push(`  seq: ${seq}`);
    lines.push(`}`);
    lines.push("");

    // method block
    lines.push(`${method} {`);
    lines.push(`  url: ${url}`);
    if (bodyType !== "none") lines.push(`  body: ${bodyType}`);
    if (authType !== "none") lines.push(`  auth: ${authType}`);
    lines.push(`}`);
    lines.push("");

    // query params
    if (dto.params_query && Object.keys(dto.params_query).length > 0) {
      lines.push(`params:query {`);
      for (const [k, v] of Object.entries(dto.params_query)) {
        lines.push(`  ${k}: ${v}`);
      }
      lines.push(`}`);
      lines.push("");
    }

    // headers
    if (dto.headers && Object.keys(dto.headers).length > 0) {
      lines.push(`headers {`);
      for (const [k, v] of Object.entries(dto.headers)) {
        lines.push(`  ${k}: ${v}`);
      }
      lines.push(`}`);
      lines.push("");
    }

    // body
    if (dto.body && bodyType !== "none") {
      lines.push(...this.serializeBody(bodyType, dto.body));
    }

    // auth config
    if (dto.auth && dto.auth.type !== "none" && dto.auth.type !== "inherit") {
      lines.push(...this.serializeAuth(dto.auth));
    }

    // vars:pre-request
    if (dto.vars_pre && Object.keys(dto.vars_pre).length > 0) {
      lines.push(`vars:pre-request {`);
      for (const [k, v] of Object.entries(dto.vars_pre)) {
        lines.push(`  ${k}: ${v}`);
      }
      lines.push(`}`);
      lines.push("");
    }

    // vars:post-response
    if (dto.vars_post && Object.keys(dto.vars_post).length > 0) {
      lines.push(`vars:post-response {`);
      for (const [k, v] of Object.entries(dto.vars_post)) {
        lines.push(`  ${k}: ${v}`);
      }
      lines.push(`}`);
      lines.push("");
    }

    // assert
    if (dto.assertions && dto.assertions.length > 0) {
      lines.push(...this.serializeAssertions(dto.assertions));
    }

    // script:pre-request
    if (dto.script_pre?.trim()) {
      lines.push(`script:pre-request {`);
      lines.push(dto.script_pre);
      lines.push(`}`);
      lines.push("");
    }

    // script:post-response
    if (dto.script_post?.trim()) {
      lines.push(`script:post-response {`);
      lines.push(dto.script_post);
      lines.push(`}`);
      lines.push("");
    }

    // tests
    if (dto.tests?.trim()) {
      lines.push(`tests {`);
      lines.push(dto.tests);
      lines.push(`}`);
      lines.push("");
    }

    // docs
    if (dto.docs?.trim()) {
      lines.push(`docs {`);
      lines.push(dto.docs);
      lines.push(`}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  private serializeBody(bodyType: BodyType, body: unknown): string[] {
    const lines: string[] = [];
    const blockName = `body:${bodyType}`;
    lines.push(`${blockName} {`);
    if (typeof body === "string") {
      lines.push(body);
    } else {
      lines.push(JSON.stringify(body, null, 2));
    }
    lines.push(`}`);
    lines.push("");
    return lines;
  }

  private serializeAuth(auth: AuthConfigDTO): string[] {
    const lines: string[] = [];
    switch (auth.type) {
      case "bearer":
        lines.push(`auth:bearer {`);
        lines.push(`  token: ${auth.token ?? ""}`);
        lines.push(`}`);
        break;
      case "basic":
        lines.push(`auth:basic {`);
        lines.push(`  username: ${auth.username ?? ""}`);
        lines.push(`  password: ${auth.password ?? ""}`);
        lines.push(`}`);
        break;
      case "apikey":
        lines.push(`auth:apikey {`);
        lines.push(`  key: ${auth.key ?? ""}`);
        lines.push(`  value: ${auth.value ?? ""}`);
        lines.push(`  placement: ${auth.placement ?? "header"}`);
        lines.push(`}`);
        break;
      case "oauth2":
        lines.push(`auth:oauth2 {`);
        if (auth.grant_type) lines.push(`  grant_type: ${auth.grant_type}`);
        if (auth.access_token_url) lines.push(`  access_token_url: ${auth.access_token_url}`);
        if (auth.authorization_url) lines.push(`  authorization_url: ${auth.authorization_url}`);
        if (auth.callback_url) lines.push(`  callback_url: ${auth.callback_url}`);
        if (auth.client_id) lines.push(`  client_id: ${auth.client_id}`);
        if (auth.client_secret) lines.push(`  client_secret: ${auth.client_secret}`);
        if (auth.scope) lines.push(`  scope: ${auth.scope}`);
        if (auth.token_placement) lines.push(`  token_placement: ${auth.token_placement}`);
        if (auth.token_header_prefix) lines.push(`  token_header_prefix: ${auth.token_header_prefix}`);
        if (auth.auto_fetch !== undefined) lines.push(`  auto_fetch: ${auth.auto_fetch}`);
        if (auth.auto_refresh !== undefined) lines.push(`  auto_refresh: ${auth.auto_refresh}`);
        if (auth.pkce !== undefined) lines.push(`  pkce: ${auth.pkce}`);
        lines.push(`}`);
        break;
      case "awsv4":
        lines.push(`auth:awsv4 {`);
        if (auth.access_key_id) lines.push(`  accessKeyId: ${auth.access_key_id}`);
        if (auth.secret_access_key) lines.push(`  secretAccessKey: ${auth.secret_access_key}`);
        if (auth.session_token) lines.push(`  sessionToken: ${auth.session_token}`);
        if (auth.region) lines.push(`  region: ${auth.region}`);
        if (auth.service) lines.push(`  service: ${auth.service}`);
        if (auth.profile_name) lines.push(`  profileName: ${auth.profile_name}`);
        lines.push(`}`);
        break;
      case "ntlm":
        lines.push(`auth:ntlm {`);
        lines.push(`  username: ${auth.username ?? ""}`);
        lines.push(`  password: ${auth.password ?? ""}`);
        if (auth.domain) lines.push(`  domain: ${auth.domain}`);
        lines.push(`}`);
        break;
      case "wsse":
        lines.push(`auth:wsse {`);
        lines.push(`  username: ${auth.username ?? ""}`);
        lines.push(`  password: ${auth.password ?? ""}`);
        lines.push(`}`);
        break;
      case "digest":
        lines.push(`auth:digest {`);
        lines.push(`  username: ${auth.username ?? ""}`);
        lines.push(`  password: ${auth.password ?? ""}`);
        lines.push(`}`);
        break;
    }
    lines.push("");
    return lines;
  }

  private serializeAssertions(assertions: AssertionDTO[]): string[] {
    const lines: string[] = [];
    lines.push(`assert {`);
    for (const a of assertions) {
      const prefix = a.enabled ? "" : "~";
      const val = Array.isArray(a.value) ? `[${a.value.join(", ")}]` : a.value ?? "";
      lines.push(`  ${prefix}${a.expression}: ${a.operator} ${val}`.trimEnd());
    }
    lines.push(`}`);
    lines.push("");
    return lines;
  }

  serializeEnvironment(vars: Record<string, string>, secretKeys: string[]): string {
    const lines: string[] = [];
    lines.push(`vars {`);
    for (const [k, v] of Object.entries(vars)) {
      if (!secretKeys.includes(k)) {
        lines.push(`  ${k}: ${v}`);
      }
    }
    lines.push(`}`);
    if (secretKeys.length > 0) {
      lines.push("");
      lines.push(`vars:secret [`);
      for (const k of secretKeys) {
        lines.push(`  ${k},`);
      }
      lines.push(`]`);
    }
    return lines.join("\n") + "\n";
  }

  serializeFolderBru(config: {
    name: string;
    auth?: AuthConfigDTO;
    headers?: Record<string, string>;
    script_pre?: string;
    script_post?: string;
  }): string {
    const lines: string[] = [];
    lines.push(`meta {`);
    lines.push(`  name: ${config.name}`);
    lines.push(`}`);
    lines.push("");

    if (config.headers && Object.keys(config.headers).length > 0) {
      lines.push(`headers {`);
      for (const [k, v] of Object.entries(config.headers)) {
        lines.push(`  ${k}: ${v}`);
      }
      lines.push(`}`);
      lines.push("");
    }

    if (config.auth) {
      lines.push(...this.serializeAuth(config.auth));
    }

    if (config.script_pre?.trim()) {
      lines.push(`script:pre-request {`);
      lines.push(config.script_pre);
      lines.push(`}`);
      lines.push("");
    }

    if (config.script_post?.trim()) {
      lines.push(`script:post-response {`);
      lines.push(config.script_post);
      lines.push(`}`);
      lines.push("");
    }

    return lines.join("\n");
  }
}
