/**
 * Bruno MCP Server — Entry Point
 * ─────────────────────────────────────────────────────────────────────────
 * Bootstraps the MCP server with all 65 tools organized across 9 domains:
 *   Collections & Folders | Requests | Environments | Auth | Scripts |
 *   Tests & Assertions    | Runner   | Secrets      | Import/Export
 *
 * Architecture: MCP Tool Layer → Service Layer → Repository Layer → FS/Bru
 * Principles: SOLID · DRY · Tell Don't Ask · ISP · Repository · Service · DTO
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pino from "pino";

import { config } from "./config/config.js";

// ─── Bru Layer ─────────────────────────────────────────────────────────────
import { BruParser } from "./bru/BruParser.js";
import { BruSerializer } from "./bru/BruSerializer.js";

// ─── Repositories ──────────────────────────────────────────────────────────
import { CollectionRepository } from "./repositories/CollectionRepository.js";
import { RequestRepository } from "./repositories/RequestRepository.js";
import { EnvironmentRepository } from "./repositories/EnvironmentRepository.js";

// ─── Services ──────────────────────────────────────────────────────────────
import { CollectionService } from "./services/CollectionService.js";
import { RequestService } from "./services/RequestService.js";
import { EnvironmentService } from "./services/EnvironmentService.js";
import { RunnerService } from "./services/RunnerService.js";
import { SecretService } from "./services/SecretService.js";
import { ImportExportService } from "./services/ImportExportService.js";

// ─── Tool Registrars ───────────────────────────────────────────────────────
import { registerCollectionTools } from "./tools/collection.tools.js";
import { registerRequestTools } from "./tools/request.tools.js";
import {
  registerEnvironmentTools,
  registerAuthTools,
  registerScriptTools,
  registerTestTools,
  registerRunnerTools,
  registerSecretTools,
  registerImportExportTools,
} from "./tools/domain.tools.js";

// ─── Logger ────────────────────────────────────────────────────────────────
const logger = pino({
  level: config.logLevel,
  transport:
    config.logFormat === "pretty"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

async function bootstrap(): Promise<void> {
  logger.info({ name: config.mcpServerName, version: config.mcpServerVersion }, "Starting Bruno MCP Server");

  // ── 1. Initialize Bru Lang parser ─────────────────────────────────────
  const parser = new BruParser();
  await parser.init();
  const serializer = new BruSerializer();

  // ── 2. Instantiate repositories (DRY: shared parser/serializer) ────────
  const collectionRepo = new CollectionRepository(parser, serializer);
  const requestRepo = new RequestRepository(parser, serializer);
  const environmentRepo = new EnvironmentRepository(parser, serializer);

  // ── 3. Instantiate services (Service Layer, Tell Don't Ask) ────────────
  const collectionService = new CollectionService(collectionRepo);
  const requestService = new RequestService(requestRepo);
  const environmentService = new EnvironmentService(environmentRepo);
  const runnerService = new RunnerService(config);
  const secretService = new SecretService(environmentRepo);
  const importExportService = new ImportExportService();

  // ── 4. Create MCP Server ───────────────────────────────────────────────
  const server = new McpServer({
    name: config.mcpServerName,
    version: config.mcpServerVersion,
  });

  // ── 5. Register all 65 tools ───────────────────────────────────────────
  // Colecciones & Carpetas (10 tools)
  registerCollectionTools(server as Parameters<typeof registerCollectionTools>[0], collectionService, config);

  // Requests .bru (12 tools)
  registerRequestTools(server as Parameters<typeof registerRequestTools>[0], requestService, config);

  // Environments & Variables (9 tools)
  registerEnvironmentTools(server as Parameters<typeof registerEnvironmentTools>[0], environmentService, config);

  // Autenticación (10 tools)
  registerAuthTools(server as Parameters<typeof registerAuthTools>[0], requestService, config);

  // Scripts (7 tools)
  registerScriptTools(server as Parameters<typeof registerScriptTools>[0], requestService, config);

  // Tests & Assertions (9 tools)
  registerTestTools(server as Parameters<typeof registerTestTools>[0], requestService, config);

  // Runner & CLI (6 tools)
  registerRunnerTools(server as Parameters<typeof registerRunnerTools>[0], runnerService, config);

  // Secret Management (5 tools)
  registerSecretTools(server as Parameters<typeof registerSecretTools>[0], secretService, config);

  // Import / Export (6 tools)
  registerImportExportTools(server as Parameters<typeof registerImportExportTools>[0], importExportService, config);

  logger.info("All 65 MCP tools registered successfully");

  // ── 6. Start transport ─────────────────────────────────────────────────
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info({ transport: config.mcpTransport }, "Bruno MCP Server running");
}

bootstrap().catch((err) => {
  console.error("Fatal error starting Bruno MCP Server:", err);
  process.exit(1);
});
