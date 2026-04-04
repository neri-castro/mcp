import { z } from "zod";
import { success, failure } from "../dto/common/index.js";
import type { EnvironmentService } from "../services/EnvironmentService.js";
import type { RequestService } from "../services/RequestService.js";
import type { RunnerService } from "../services/RunnerService.js";
import type { SecretService } from "../services/SecretService.js";
import type { ImportExportService } from "../services/ImportExportService.js";
import type { Config } from "../config/config.js";
import { assertPathAllowed } from "../utils/path.js";
import type { AssertionDTO } from "../dto/test/AssertionDTO.js";

function respond(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function respondError(err: unknown) {
  const e = err as { code?: string; message?: string; path?: string };
  return respond(failure((e.code as Parameters<typeof failure>[0]) ?? "UNKNOWN_ERROR", e.message ?? "Unknown error", { path: e.path }));
}

type McpServer = {
  tool: (name: string, desc: string, schema: object, handler: (args: unknown) => Promise<{ content: { type: string; text: string }[] }>) => void
};

// ═══════════════════════════════════════════════════════════════════════════
//  ENVIRONMENT TOOLS (9 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerEnvironmentTools(server: McpServer, envService: EnvironmentService, config: Config) {
  server.tool("bruno_env_list", "Lists all environments available in a collection.",
    z.object({ collection_path: z.string() }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await envService.listEnvironments(collection_path);
        return respond(success(result, { path: collection_path, operation: "bruno_env_list" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_create", "Creates a new environment .bru file with variables.",
    z.object({
      collection_path: z.string(),
      env_name: z.string().min(1),
      vars: z.record(z.string()).optional(),
      secret_keys: z.array(z.string()).optional(),
    }).shape,
    async (args) => {
      const dto = args as Parameters<typeof envService.createEnvironment>[0];
      try {
        assertPathAllowed(dto.collection_path, config);
        const result = await envService.createEnvironment(dto);
        return respond(success(result, { path: result.file_path, operation: "bruno_env_create" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_get", "Reads all variables from an environment file.",
    z.object({ collection_path: z.string(), env_name: z.string() }).shape,
    async (args) => {
      const { collection_path, env_name } = args as { collection_path: string; env_name: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await envService.getEnvironment(collection_path, env_name);
        return respond(success(result, { path: collection_path, operation: "bruno_env_get" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_update", "Updates variables in an environment file (merges with existing).",
    z.object({
      collection_path: z.string(),
      env_name: z.string(),
      vars: z.record(z.string()).optional(),
      secret_keys: z.array(z.string()).optional(),
    }).shape,
    async (args) => {
      const { collection_path, env_name, ...dto } = args as { collection_path: string; env_name: string; vars?: Record<string, string>; secret_keys?: string[] };
      try {
        assertPathAllowed(collection_path, config);
        const result = await envService.updateEnvironment(collection_path, env_name, dto);
        return respond(success(result, { path: collection_path, operation: "bruno_env_update" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_delete", "Deletes an environment file from a collection.",
    z.object({ collection_path: z.string(), env_name: z.string() }).shape,
    async (args) => {
      const { collection_path, env_name } = args as { collection_path: string; env_name: string };
      try {
        assertPathAllowed(collection_path, config);
        await envService.deleteEnvironment(collection_path, env_name);
        return respond(success({ deleted: true }, { path: collection_path, operation: "bruno_env_delete" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_set_var", "Adds or updates a single variable in an environment.",
    z.object({
      collection_path: z.string(), env_name: z.string(),
      key: z.string().min(1), value: z.string(),
      is_secret: z.boolean().default(false),
    }).shape,
    async (args) => {
      const { collection_path, env_name, key, value, is_secret } = args as { collection_path: string; env_name: string; key: string; value: string; is_secret: boolean };
      try {
        assertPathAllowed(collection_path, config);
        const result = await envService.setVariable(collection_path, env_name, key, value, is_secret);
        return respond(success(result, { path: collection_path, operation: "bruno_env_set_var" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_remove_var", "Removes a variable from an environment.",
    z.object({ collection_path: z.string(), env_name: z.string(), key: z.string() }).shape,
    async (args) => {
      const { collection_path, env_name, key } = args as { collection_path: string; env_name: string; key: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await envService.removeVariable(collection_path, env_name, key);
        return respond(success(result, { path: collection_path, operation: "bruno_env_remove_var" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_env_mark_secret", "Marks one or more variables as secret (excluded from Git sync).",
    z.object({ collection_path: z.string(), env_name: z.string(), keys: z.array(z.string()) }).shape,
    async (args) => {
      const { collection_path, env_name, keys } = args as { collection_path: string; env_name: string; keys: string[] };
      try {
        assertPathAllowed(collection_path, config);
        const result = await envService.markSecret(collection_path, env_name, keys);
        return respond(success(result, { path: collection_path, operation: "bruno_env_mark_secret" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_var_interpolate", "Interpolates {{variable}} placeholders in a template string using environment variables.",
    z.object({
      collection_path: z.string(), env_name: z.string(),
      template_string: z.string(),
    }).shape,
    async (args) => {
      const { collection_path, env_name, template_string } = args as { collection_path: string; env_name: string; template_string: string };
      try {
        assertPathAllowed(collection_path, config);
        const env = await envService.getEnvironment(collection_path, env_name);
        const result = envService.interpolate(template_string, env.vars);
        return respond(success({ result }, { path: collection_path, operation: "bruno_var_interpolate" }));
      } catch (err) { return respondError(err); }
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH TOOLS (10 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerAuthTools(server: McpServer, requestService: RequestService, config: Config) {
  const authTool = (name: string, desc: string, schema: object, authBuilder: (args: Record<string, unknown>) => object) => {
    server.tool(name, desc, { target_path: z.string(), ...schema } as object,
      async (args) => {
        const a = args as Record<string, unknown>;
        try {
          assertPathAllowed(a["target_path"] as string, config);
          await requestService.setAuth(a["target_path"] as string, authBuilder(a) as Parameters<typeof requestService.setAuth>[1]);
          return respond(success({ auth_set: true }, { path: a["target_path"] as string, operation: name }));
        } catch (err) { return respondError(err); }
      }
    );
  };

  authTool("bruno_auth_set_bearer", "Configures Bearer Token authentication on a request, folder, or collection.",
    { token_var: z.string().describe("Variable expression e.g. {{authToken}}") },
    (a) => ({ type: "bearer", token: a["token_var"] })
  );

  authTool("bruno_auth_set_basic", "Configures Basic Auth (username/password Base64).",
    { username_var: z.string(), password_var: z.string() },
    (a) => ({ type: "basic", username: a["username_var"], password: a["password_var"] })
  );

  authTool("bruno_auth_set_apikey", "Configures API Key authentication (header or query placement).",
    { key: z.string(), value_var: z.string(), placement: z.enum(["header", "query"]).default("header") },
    (a) => ({ type: "apikey", key: a["key"], value: a["value_var"], placement: a["placement"] })
  );

  server.tool("bruno_auth_set_oauth2", "Configures OAuth2 with any grant type (authorization_code, client_credentials, password, implicit).",
    z.object({
      target_path: z.string(),
      grant_type: z.enum(["authorization_code", "client_credentials", "password", "implicit"]),
      oauth_config: z.object({
        client_id: z.string().optional(), client_secret: z.string().optional(),
        access_token_url: z.string().optional(), authorization_url: z.string().optional(),
        callback_url: z.string().optional(), scope: z.string().optional(),
        token_placement: z.enum(["header", "url"]).optional(),
        token_header_prefix: z.string().optional(),
        auto_fetch: z.boolean().optional(), auto_refresh: z.boolean().optional(),
        pkce: z.boolean().optional(),
        username: z.string().optional(), password: z.string().optional(),
      }),
    }).shape,
    async (args) => {
      const { target_path, grant_type, oauth_config } = args as { target_path: string; grant_type: string; oauth_config: Record<string, unknown> };
      try {
        assertPathAllowed(target_path, config);
        await requestService.setAuth(target_path, { type: "oauth2", grant_type: grant_type as Parameters<typeof requestService.setAuth>[1]["grant_type"], ...oauth_config } as Parameters<typeof requestService.setAuth>[1]);
        return respond(success({ auth_set: true }, { path: target_path, operation: "bruno_auth_set_oauth2" }));
      } catch (err) { return respondError(err); }
    }
  );

  authTool("bruno_auth_set_awsv4", "Configures AWS Signature V4 authentication.",
    { aws_config: z.object({ access_key_id: z.string().optional(), secret_access_key: z.string().optional(), region: z.string().optional(), service: z.string().optional(), session_token: z.string().optional(), profile_name: z.string().optional() }) },
    (a) => ({ type: "awsv4", ...(a["aws_config"] as object) })
  );

  authTool("bruno_auth_set_ntlm", "Configures NTLM authentication (Windows/Active Directory).",
    { username: z.string(), password: z.string(), domain: z.string().optional() },
    (a) => ({ type: "ntlm", username: a["username"], password: a["password"], domain: a["domain"] })
  );

  authTool("bruno_auth_set_digest", "Configures Digest authentication (RFC 2617 challenge-response).",
    { username: z.string(), password: z.string() },
    (a) => ({ type: "digest", username: a["username"], password: a["password"] })
  );

  authTool("bruno_auth_set_inherit", "Sets auth: inherit — request uses authentication from parent folder or collection.",
    {},
    () => ({ type: "inherit" })
  );

  authTool("bruno_auth_set_none", "Removes authentication from a request.",
    {},
    () => ({ type: "none" })
  );

  server.tool("bruno_auth_get", "Reads the current authentication configuration of a request or folder.",
    z.object({ target_path: z.string() }).shape,
    async (args) => {
      const { target_path } = args as { target_path: string };
      try {
        assertPathAllowed(target_path, config);
        const result = await requestService.getAuth(target_path);
        return respond(success(result, { path: target_path, operation: "bruno_auth_get" }));
      } catch (err) { return respondError(err); }
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCRIPT TOOLS (7 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerScriptTools(server: McpServer, requestService: RequestService, config: Config) {
  server.tool("bruno_script_set_pre_request", "Sets the pre-request JavaScript script on a request, folder, or collection.",
    z.object({ target_path: z.string(), script_js: z.string() }).shape,
    async (args) => {
      const { target_path, script_js } = args as { target_path: string; script_js: string };
      try {
        assertPathAllowed(target_path, config);
        await requestService.setPreRequestScript(target_path, script_js);
        return respond(success({ script_set: true }, { path: target_path, operation: "bruno_script_set_pre_request" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_script_set_post_response", "Sets the post-response JavaScript script on a request, folder, or collection.",
    z.object({ target_path: z.string(), script_js: z.string() }).shape,
    async (args) => {
      const { target_path, script_js } = args as { target_path: string; script_js: string };
      try {
        assertPathAllowed(target_path, config);
        await requestService.setPostResponseScript(target_path, script_js);
        return respond(success({ script_set: true }, { path: target_path, operation: "bruno_script_set_post_response" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_script_get", "Reads the pre-request and post-response scripts from a request or folder.",
    z.object({ target_path: z.string() }).shape,
    async (args) => {
      const { target_path } = args as { target_path: string };
      try {
        assertPathAllowed(target_path, config);
        const result = await requestService.getScripts(target_path);
        return respond(success(result, { path: target_path, operation: "bruno_script_get" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_script_clear", "Removes a pre or post script from a request.",
    z.object({ target_path: z.string(), type: z.enum(["pre", "post"]) }).shape,
    async (args) => {
      const { target_path, type } = args as { target_path: string; type: "pre" | "post" };
      try {
        assertPathAllowed(target_path, config);
        await requestService.clearScript(target_path, type);
        return respond(success({ cleared: true }, { path: target_path, operation: "bruno_script_clear" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_script_validate", "Validates JavaScript syntax of a script without executing it.",
    z.object({ script_js: z.string() }).shape,
    async (args) => {
      const { script_js } = args as { script_js: string };
      const result = requestService.validateScript(script_js);
      return respond(success(result, { path: "", operation: "bruno_script_validate" }));
    }
  );

  server.tool("bruno_vars_pre_set", "Sets the vars:pre-request block (declarative variable extraction before request).",
    z.object({ request_path: z.string(), vars_map: z.record(z.string()) }).shape,
    async (args) => {
      const { request_path, vars_map } = args as { request_path: string; vars_map: Record<string, string> };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.updateRequest(request_path, { vars_pre: vars_map });
        return respond(success(result, { path: request_path, operation: "bruno_vars_pre_set" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_vars_post_set", "Sets the vars:post-response block (declarative variable extraction from response).",
    z.object({ request_path: z.string(), vars_map: z.record(z.string()) }).shape,
    async (args) => {
      const { request_path, vars_map } = args as { request_path: string; vars_map: Record<string, string> };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.updateRequest(request_path, { vars_post: vars_map });
        return respond(success(result, { path: request_path, operation: "bruno_vars_post_set" }));
      } catch (err) { return respondError(err); }
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEST & ASSERTION TOOLS (9 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerTestTools(server: McpServer, requestService: RequestService, config: Config) {
  const assertionOperators = ["eq","neq","lt","lte","gt","gte","in","notIn","contains","notContains",
    "startsWith","endsWith","matches","between","isNull","isNotNull","isDefined","isUndefined",
    "isTrue","isFalse","isBoolean","isNumber","isString","isArray","isObject","isJson","isEmpty","isNotEmpty"] as const;

  server.tool("bruno_assertion_add", "Adds a declarative assertion to a .bru request (assert block).",
    z.object({
      request_path: z.string(),
      expression: z.string().describe("e.g. res.status, res.body.user.id"),
      operator: z.enum(assertionOperators),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
      enabled: z.boolean().default(true),
    }).shape,
    async (args) => {
      const { request_path, ...assertion } = args as { request_path: string } & AssertionDTO;
      try {
        assertPathAllowed(request_path, config);
        await requestService.addAssertion(request_path, assertion);
        return respond(success({ added: true }, { path: request_path, operation: "bruno_assertion_add" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_assertion_list", "Lists all assertions in a .bru request.",
    z.object({ request_path: z.string() }).shape,
    async (args) => {
      const { request_path } = args as { request_path: string };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.listAssertions(request_path);
        return respond(success(result, { path: request_path, operation: "bruno_assertion_list" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_assertion_remove", "Removes an assertion by index from a .bru request.",
    z.object({ request_path: z.string(), assertion_index: z.number().int().min(0) }).shape,
    async (args) => {
      const { request_path, assertion_index } = args as { request_path: string; assertion_index: number };
      try {
        assertPathAllowed(request_path, config);
        await requestService.removeAssertion(request_path, assertion_index);
        return respond(success({ removed: true }, { path: request_path, operation: "bruno_assertion_remove" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_assertion_toggle", "Enables or disables an assertion by index.",
    z.object({ request_path: z.string(), assertion_index: z.number().int().min(0), enabled: z.boolean() }).shape,
    async (args) => {
      const { request_path, assertion_index, enabled } = args as { request_path: string; assertion_index: number; enabled: boolean };
      try {
        assertPathAllowed(request_path, config);
        await requestService.toggleAssertion(request_path, assertion_index, enabled);
        return respond(success({ toggled: true }, { path: request_path, operation: "bruno_assertion_toggle" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_assertion_clear", "Removes all assertions from a .bru request.",
    z.object({ request_path: z.string() }).shape,
    async (args) => {
      const { request_path } = args as { request_path: string };
      try {
        assertPathAllowed(request_path, config);
        await requestService.clearAssertions(request_path);
        return respond(success({ cleared: true }, { path: request_path, operation: "bruno_assertion_clear" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_test_set", "Sets the full tests block (Chai expect() JavaScript) in a .bru request.",
    z.object({ request_path: z.string(), tests_js: z.string() }).shape,
    async (args) => {
      const { request_path, tests_js } = args as { request_path: string; tests_js: string };
      try {
        assertPathAllowed(request_path, config);
        await requestService.setTests(request_path, tests_js);
        return respond(success({ set: true }, { path: request_path, operation: "bruno_test_set" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_test_get", "Reads the current tests block from a .bru request.",
    z.object({ request_path: z.string() }).shape,
    async (args) => {
      const { request_path } = args as { request_path: string };
      try {
        assertPathAllowed(request_path, config);
        const result = await requestService.getTests(request_path);
        return respond(success({ tests: result }, { path: request_path, operation: "bruno_test_get" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_test_clear", "Removes all tests from a .bru request.",
    z.object({ request_path: z.string() }).shape,
    async (args) => {
      const { request_path } = args as { request_path: string };
      try {
        assertPathAllowed(request_path, config);
        await requestService.clearTests(request_path);
        return respond(success({ cleared: true }, { path: request_path, operation: "bruno_test_clear" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_test_validate_syntax", "Validates JavaScript syntax of a tests block without executing it.",
    z.object({ tests_js: z.string() }).shape,
    async (args) => {
      const { tests_js } = args as { tests_js: string };
      const result = requestService.validateTestSyntax(tests_js);
      return respond(success(result, { path: "", operation: "bruno_test_validate_syntax" }));
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  RUNNER TOOLS (6 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerRunnerTools(server: McpServer, runnerService: RunnerService, config: Config) {
  const runOptionsSchema = {
    env_name: z.string().optional(),
    env_overrides: z.record(z.string()).optional(),
    output_path: z.string().optional(),
    format: z.enum(["json", "junit", "html"]).optional(),
    bail: z.boolean().optional(),
    insecure: z.boolean().optional(),
    timeout_ms: z.number().optional(),
    delay_ms: z.number().optional(),
    cacert: z.string().optional(),
  };

  server.tool("bruno_run_collection", "Runs an entire Bruno collection using bru run. Returns test results and summaries.",
    z.object({ collection_path: z.string(), ...runOptionsSchema }).shape,
    async (args) => {
      const { collection_path, ...options } = args as { collection_path: string } & Record<string, unknown>;
      try {
        assertPathAllowed(collection_path, config);
        const result = await runnerService.runCollection(collection_path, options as Parameters<typeof runnerService.runCollection>[1]);
        return respond(success(result, { path: collection_path, operation: "bruno_run_collection" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_run_folder", "Runs all requests within a specific folder.",
    z.object({ folder_path: z.string(), ...runOptionsSchema }).shape,
    async (args) => {
      const { folder_path, ...options } = args as { folder_path: string } & Record<string, unknown>;
      try {
        assertPathAllowed(folder_path, config);
        const result = await runnerService.runFolder(folder_path, options as Parameters<typeof runnerService.runFolder>[1]);
        return respond(success(result, { path: folder_path, operation: "bruno_run_folder" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_run_request", "Runs a single .bru request and returns its result.",
    z.object({
      request_path: z.string(),
      env_name: z.string().default(""),
      env_overrides: z.record(z.string()).optional(),
    }).shape,
    async (args) => {
      const { request_path, env_name, env_overrides } = args as { request_path: string; env_name: string; env_overrides?: Record<string, string> };
      try {
        assertPathAllowed(request_path, config);
        const result = await runnerService.runRequest(request_path, env_name, env_overrides);
        return respond(success(result, { path: request_path, operation: "bruno_run_request" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_run_get_results", "Retrieves stored run results by run ID.",
    z.object({ run_id: z.string() }).shape,
    async (args) => {
      const { run_id } = args as { run_id: string };
      try {
        const { default: fs } = await import("fs/promises");
        const { default: path } = await import("path");
        const reportPath = path.join(config.reportsDir, `${run_id}.json`);
        const raw = await fs.readFile(reportPath, "utf-8");
        return respond(success(JSON.parse(raw), { path: reportPath, operation: "bruno_run_get_results" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_run_generate_report", "Generates a report in JSON, JUnit, or HTML format from a run result.",
    z.object({
      run_id: z.string(),
      format: z.enum(["json", "junit", "html"]),
      output_path: z.string(),
    }).shape,
    async (args) => {
      const { run_id, format, output_path } = args as { run_id: string; format: string; output_path: string };
      try {
        const { default: fs } = await import("fs/promises");
        const { default: path } = await import("path");
        const srcPath = path.join(config.reportsDir, `${run_id}.json`);
        const raw = await fs.readFile(srcPath, "utf-8");
        assertPathAllowed(output_path, config);
        await fs.mkdir(path.dirname(output_path), { recursive: true });
        if (format === "json") {
          await fs.copyFile(srcPath, output_path);
        } else {
          // For junit/html, just write structured content
          await fs.writeFile(output_path, raw, "utf-8");
        }
        return respond(success({ format, output_path }, { path: output_path, operation: "bruno_run_generate_report" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_run_list_reports", "Lists all generated reports for a collection.",
    z.object({ collection_path: z.string() }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await runnerService.listReports(collection_path);
        return respond(success(result, { path: collection_path, operation: "bruno_run_list_reports" }));
      } catch (err) { return respondError(err); }
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECRET TOOLS (5 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerSecretTools(server: McpServer, secretService: SecretService, config: Config) {
  server.tool("bruno_secret_get_env_template", "Generates a .env.example file listing all declared secret variables across environments.",
    z.object({ collection_path: z.string() }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await secretService.getEnvTemplate(collection_path);
        return respond(success({ template: result }, { path: collection_path, operation: "bruno_secret_get_env_template" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_secret_list", "Lists all variables declared as secret in a specific environment.",
    z.object({ collection_path: z.string(), env_name: z.string() }).shape,
    async (args) => {
      const { collection_path, env_name } = args as { collection_path: string; env_name: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await secretService.list(collection_path, env_name);
        return respond(success(result, { path: collection_path, operation: "bruno_secret_list" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_secret_add", "Adds a variable to the vars:secret [] declaration in an environment.",
    z.object({ collection_path: z.string(), env_name: z.string(), key: z.string() }).shape,
    async (args) => {
      const { collection_path, env_name, key } = args as { collection_path: string; env_name: string; key: string };
      try {
        assertPathAllowed(collection_path, config);
        await secretService.add(collection_path, env_name, key);
        return respond(success({ added: true }, { path: collection_path, operation: "bruno_secret_add" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_secret_remove", "Removes a variable from the vars:secret [] declaration.",
    z.object({ collection_path: z.string(), env_name: z.string(), key: z.string() }).shape,
    async (args) => {
      const { collection_path, env_name, key } = args as { collection_path: string; env_name: string; key: string };
      try {
        assertPathAllowed(collection_path, config);
        await secretService.remove(collection_path, env_name, key);
        return respond(success({ removed: true }, { path: collection_path, operation: "bruno_secret_remove" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_secret_generate_gitignore", "Generates or updates .gitignore to exclude .env and sensitive files.",
    z.object({ collection_path: z.string() }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        const content = await secretService.generateGitignore(collection_path);
        return respond(success({ content }, { path: collection_path, operation: "bruno_secret_generate_gitignore" }));
      } catch (err) { return respondError(err); }
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  IMPORT / EXPORT TOOLS (6 tools)
// ═══════════════════════════════════════════════════════════════════════════
export function registerImportExportTools(server: McpServer, importExportService: ImportExportService, config: Config) {
  server.tool("bruno_import_postman", "Imports a Postman Collection v2.1 JSON into a Bruno collection.",
    z.object({ postman_json_path: z.string(), target_collection_path: z.string() }).shape,
    async (args) => {
      const { postman_json_path, target_collection_path } = args as { postman_json_path: string; target_collection_path: string };
      try {
        assertPathAllowed(target_collection_path, config);
        await importExportService.importPostman(postman_json_path, target_collection_path);
        return respond(success({ imported: true }, { path: target_collection_path, operation: "bruno_import_postman" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_import_insomnia", "Imports an Insomnia workspace JSON into a Bruno collection.",
    z.object({ insomnia_json_path: z.string(), target_collection_path: z.string() }).shape,
    async (args) => {
      const { insomnia_json_path, target_collection_path } = args as { insomnia_json_path: string; target_collection_path: string };
      try {
        assertPathAllowed(target_collection_path, config);
        await importExportService.importInsomnia(insomnia_json_path, target_collection_path);
        return respond(success({ imported: true }, { path: target_collection_path, operation: "bruno_import_insomnia" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_import_openapi", "Generates a Bruno collection from an OpenAPI 3.0 spec file.",
    z.object({ openapi_path: z.string(), target_collection_path: z.string() }).shape,
    async (args) => {
      const { openapi_path, target_collection_path } = args as { openapi_path: string; target_collection_path: string };
      try {
        assertPathAllowed(target_collection_path, config);
        await importExportService.importOpenApi(openapi_path, target_collection_path);
        return respond(success({ imported: true }, { path: target_collection_path, operation: "bruno_import_openapi" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_import_wsdl", "Generates Bruno requests from a WSDL (SOAP) file.",
    z.object({ wsdl_path: z.string(), target_collection_path: z.string() }).shape,
    async (args) => {
      const { wsdl_path, target_collection_path } = args as { wsdl_path: string; target_collection_path: string };
      try {
        assertPathAllowed(target_collection_path, config);
        await importExportService.importWsdl(wsdl_path, target_collection_path);
        return respond(success({ imported: true }, { path: target_collection_path, operation: "bruno_import_wsdl" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_export_openapi", "Exports a Bruno collection as an OpenAPI 3.0 specification.",
    z.object({ collection_path: z.string(), output_path: z.string(), version: z.string().optional() }).shape,
    async (args) => {
      const { collection_path, output_path, version } = args as { collection_path: string; output_path: string; version?: string };
      try {
        assertPathAllowed(output_path, config);
        await importExportService.exportOpenApi(collection_path, output_path, version);
        return respond(success({ exported: true, output_path }, { path: output_path, operation: "bruno_export_openapi" }));
      } catch (err) { return respondError(err); }
    }
  );

  server.tool("bruno_export_postman", "Exports a Bruno collection as a Postman Collection v2.1 JSON.",
    z.object({ collection_path: z.string(), output_path: z.string() }).shape,
    async (args) => {
      const { collection_path, output_path } = args as { collection_path: string; output_path: string };
      try {
        assertPathAllowed(output_path, config);
        await importExportService.exportPostman(collection_path, output_path);
        return respond(success({ exported: true, output_path }, { path: output_path, operation: "bruno_export_postman" }));
      } catch (err) { return respondError(err); }
    }
  );
}
