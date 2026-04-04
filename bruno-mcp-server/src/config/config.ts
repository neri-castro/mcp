import { z } from "zod";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const configSchema = z.object({
  collectionsBasePath: z
    .string()
    .min(1, "BRUNO_COLLECTIONS_BASE_PATH is required"),
  defaultCollection: z.string().optional(),
  cliPath: z.string().optional(),
  defaultTimeoutMs: z.coerce.number().positive().default(10000),
  defaultDelayMs: z.coerce.number().min(0).default(0),
  bailOnFailure: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  insecureSsl: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  reportsDir: z.string().default("/tmp/bruno-mcp-reports"),
  defaultReportFormat: z
    .enum(["json", "junit", "html"])
    .default("json"),
  reportRetentionDays: z.coerce.number().int().min(0).default(7),
  allowedBasePaths: z
    .string()
    .transform((s) => s.split(",").map((p) => p.trim()))
    .default("/home"),
  scriptsFilesystemAccess: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  scriptsModuleWhitelist: z
    .string()
    .transform((s) => s.split(",").map((m) => m.trim()))
    .default("crypto,buffer"),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  logFormat: z.enum(["json", "pretty"]).default("json"),
  mcpServerName: z.string().default("bruno-mcp"),
  mcpServerVersion: z.string().default("1.0.0"),
  mcpTransport: z.enum(["stdio", "http"]).default("stdio"),
});

export type Config = z.infer<typeof configSchema>;

export const config = configSchema.parse({
  collectionsBasePath: process.env.BRUNO_COLLECTIONS_BASE_PATH,
  defaultCollection: process.env.BRUNO_DEFAULT_COLLECTION,
  cliPath: process.env.BRUNO_CLI_PATH,
  defaultTimeoutMs: process.env.BRUNO_DEFAULT_TIMEOUT_MS,
  defaultDelayMs: process.env.BRUNO_DEFAULT_DELAY_MS,
  bailOnFailure: process.env.BRUNO_BAIL_ON_FAILURE,
  insecureSsl: process.env.BRUNO_INSECURE_SSL,
  reportsDir: process.env.BRUNO_REPORTS_DIR,
  defaultReportFormat: process.env.BRUNO_DEFAULT_REPORT_FORMAT,
  reportRetentionDays: process.env.BRUNO_REPORT_RETENTION_DAYS,
  allowedBasePaths: process.env.BRUNO_ALLOWED_BASE_PATHS,
  scriptsFilesystemAccess: process.env.BRUNO_SCRIPTS_FILESYSTEM_ACCESS,
  scriptsModuleWhitelist: process.env.BRUNO_SCRIPTS_MODULE_WHITELIST,
  logLevel: process.env.LOG_LEVEL,
  logFormat: process.env.LOG_FORMAT,
  mcpServerName: process.env.MCP_SERVER_NAME,
  mcpServerVersion: process.env.MCP_SERVER_VERSION,
  mcpTransport: process.env.MCP_TRANSPORT,
});
