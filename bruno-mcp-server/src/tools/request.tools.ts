import { z } from "zod";
import { success, failure } from "../dto/common/index.js";
import type { RequestService } from "../services/RequestService.js";
import type { Config } from "../config/config.js";
import { assertPathAllowed } from "../utils/path.js";

const httpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);
const bodyTypeSchema = z.enum(["json", "form-urlencoded", "multipart-form", "xml", "graphql", "text", "none"]);
const authTypeSchema = z.enum(["none", "bearer", "basic", "apikey", "oauth2", "awsv4", "digest", "ntlm", "wsse", "inherit"]);

const authSchema = z.object({ type: authTypeSchema }).passthrough().optional();
const assertionSchema = z.object({
  expression: z.string(),
  operator: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  enabled: z.boolean().default(true),
});

function respond(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function respondError(err: unknown) {
  const e = err as { code?: string; message?: string; path?: string };
  return respond(failure((e.code as Parameters<typeof failure>[0]) ?? "UNKNOWN_ERROR", e.message ?? "Unknown error", { path: e.path }));
}

export function registerRequestTools(
  server: { tool: (name: string, desc: string, schema: object, handler: (args: unknown) => Promise<{ content: { type: string; text: string }[] }>) => void },
  requestService: RequestService,
  config: Config
) {
  // ─── bruno_request_create ──────────────────────────────────────────
  server.tool(
    "bruno_request_create",
    "Creates a .bru request file in a Bruno collection. Supports all HTTP methods, body types, auth, headers, query params, pre/post scripts, assertions, and Chai tests.",
    z.object({
      collection_path: z.string(),
      folder_path: z.string().optional(),
      name: z.string().min(1),
      method: httpMethodSchema,
      url: z.string().describe("URL with {{variable}} placeholders supported"),
      seq: z.number().optional(),
      body_type: bodyTypeSchema.optional(),
      body: z.unknown().optional(),
      headers: z.record(z.string()).optional(),
      params_query: z.record(z.string()).optional(),
      auth: authSchema,
      vars_pre: z.record(z.string()).optional(),
      vars_post: z.record(z.string()).optional(),
      assertions: z.array(assertionSchema).optional(),
      script_pre: z.string().optional(),
      script_post: z.string().optional(),
      tests: z.string().optional(),
      docs: z.string().optional(),
    }).shape,
    async (args) => {
      const dto = args as Parameters<typeof requestService.createRequest>[0];
      try {
        assertPathAllowed(dto.collection_path, config);
        const result = await requestService.createRequest(dto);
        return respond(success(result, { path: result.file_path, operation: "bruno_request_create" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_get ────────────────────────────────────────────
  server.tool(
    "bruno_request_get",
    "Reads and parses a .bru request file, returning all fields as a structured DTO.",
    z.object({ request_path: z.string() }).shape,
    async (args) => {
      const { request_path } = args as { request_path: string };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.getRequest(request_path);
        return respond(success(result, { path: request_path, operation: "bruno_request_get" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_list ───────────────────────────────────────────
  server.tool(
    "bruno_request_list",
    "Lists all .bru request files in a folder, ordered by seq.",
    z.object({ folder_path: z.string() }).shape,
    async (args) => {
      const { folder_path } = args as { folder_path: string };
      try {
        assertPathAllowed(folder_path, config);
        const result = await requestService.listRequests(folder_path);
        return respond(success(result, { path: folder_path, operation: "bruno_request_list" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_update ─────────────────────────────────────────
  server.tool(
    "bruno_request_update",
    "Updates any field(s) of an existing .bru request file.",
    z.object({
      request_path: z.string(),
      fields: z.object({
        method: httpMethodSchema.optional(),
        url: z.string().optional(),
        seq: z.number().optional(),
        body_type: bodyTypeSchema.optional(),
        body: z.unknown().optional(),
        headers: z.record(z.string()).optional(),
        params_query: z.record(z.string()).optional(),
        auth: authSchema,
        vars_pre: z.record(z.string()).optional(),
        vars_post: z.record(z.string()).optional(),
        assertions: z.array(assertionSchema).optional(),
        script_pre: z.string().optional(),
        script_post: z.string().optional(),
        tests: z.string().optional(),
        docs: z.string().optional(),
      }),
    }).shape,
    async (args) => {
      const { request_path, fields } = args as { request_path: string; fields: object };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.updateRequest(request_path, fields as Parameters<typeof requestService.updateRequest>[1]);
        return respond(success(result, { path: request_path, operation: "bruno_request_update" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_delete ─────────────────────────────────────────
  server.tool(
    "bruno_request_delete",
    "Deletes a .bru request file from the filesystem.",
    z.object({ request_path: z.string() }).shape,
    async (args) => {
      const { request_path } = args as { request_path: string };
      try {
        assertPathAllowed(request_path, config);
        await requestService.deleteRequest(request_path);
        return respond(success({ deleted: true }, { path: request_path, operation: "bruno_request_delete" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_clone ──────────────────────────────────────────
  server.tool(
    "bruno_request_clone",
    "Clones an existing .bru request to a new name/folder.",
    z.object({
      request_path: z.string(),
      new_name: z.string().min(1),
      target_folder: z.string(),
    }).shape,
    async (args) => {
      const { request_path, new_name, target_folder } = args as { request_path: string; new_name: string; target_folder: string };
      try {
        assertPathAllowed(target_folder, config);
        const result = await requestService.cloneRequest(request_path, new_name, target_folder);
        return respond(success(result, { path: result.file_path, operation: "bruno_request_clone" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_set_header ─────────────────────────────────────
  server.tool(
    "bruno_request_set_header",
    "Adds or updates a header in a .bru request. Use enabled=false to disable without removing.",
    z.object({
      request_path: z.string(),
      key: z.string().min(1),
      value: z.string(),
      enabled: z.boolean().default(true),
    }).shape,
    async (args) => {
      const { request_path, key, value, enabled } = args as { request_path: string; key: string; value: string; enabled: boolean };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.setHeader(request_path, key, value, enabled);
        return respond(success(result, { path: request_path, operation: "bruno_request_set_header" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_remove_header ──────────────────────────────────
  server.tool(
    "bruno_request_remove_header",
    "Removes a header from a .bru request.",
    z.object({ request_path: z.string(), key: z.string() }).shape,
    async (args) => {
      const { request_path, key } = args as { request_path: string; key: string };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.removeHeader(request_path, key);
        return respond(success(result, { path: request_path, operation: "bruno_request_remove_header" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_set_query_param ────────────────────────────────
  server.tool(
    "bruno_request_set_query_param",
    "Adds or updates a query parameter. Use enabled=false to disable (prefix ~).",
    z.object({
      request_path: z.string(),
      key: z.string().min(1),
      value: z.string(),
      enabled: z.boolean().default(true),
    }).shape,
    async (args) => {
      const { request_path, key, value, enabled } = args as { request_path: string; key: string; value: string; enabled: boolean };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.setQueryParam(request_path, key, value, enabled);
        return respond(success(result, { path: request_path, operation: "bruno_request_set_query_param" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_set_body ───────────────────────────────────────
  server.tool(
    "bruno_request_set_body",
    "Sets the body type and content of a .bru request.",
    z.object({
      request_path: z.string(),
      body_type: bodyTypeSchema,
      body: z.unknown(),
    }).shape,
    async (args) => {
      const { request_path, body_type, body } = args as { request_path: string; body_type: string; body: unknown };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.setBody(request_path, body_type, body);
        return respond(success(result, { path: request_path, operation: "bruno_request_set_body" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_set_docs ───────────────────────────────────────
  server.tool(
    "bruno_request_set_docs",
    "Sets the Markdown documentation for a .bru request (docs block).",
    z.object({ request_path: z.string(), markdown_content: z.string() }).shape,
    async (args) => {
      const { request_path, markdown_content } = args as { request_path: string; markdown_content: string };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.setDocs(request_path, markdown_content);
        return respond(success(result, { path: request_path, operation: "bruno_request_set_docs" }));
      } catch (err) { return respondError(err); }
    }
  );

  // ─── bruno_request_reorder ────────────────────────────────────────
  server.tool(
    "bruno_request_reorder",
    "Reorders requests within a folder by assigning seq numbers based on the provided order.",
    z.object({
      folder_path: z.string(),
      request_names_ordered: z.array(z.string()),
    }).shape,
    async (args) => {
      const { folder_path, request_names_ordered } = args as { folder_path: string; request_names_ordered: string[] };
      try {
        assertPathAllowed(folder_path, config);
        await requestService.reorder(folder_path, request_names_ordered);
        return respond(success({ reordered: true }, { path: folder_path, operation: "bruno_request_reorder" }));
      } catch (err) { return respondError(err); }
    }
  );
}
