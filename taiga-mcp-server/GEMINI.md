# Taiga MCP Server - Project Context

## Project Overview
This project is a **Model Context Protocol (MCP) Server** for the **Taiga REST API**. It exposes 71 tools to manage agile projects, epics, user stories, tasks, issues, sprints, and more from any LLM compatible with the MCP protocol (e.g., Claude Desktop, GPT-4).

### Main Technologies
- **Runtime:** Node.js 20+ / TypeScript 5
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **HTTP Client:** `axios` with interceptors and `axios-retry`
- **Validation:** `zod` for input validation and DTOs
- **Logging:** `pino` for structured JSON logging
- **Testing:** `vitest`
- **Schema Conversion:** `zod-to-json-schema` for MCP tool definitions

## Architecture
The project follows a strictly layered architecture to ensure maintainability and scalability:

1.  **MCP Tool Layer (`src/tools/`):** Defines the 71 tools, their descriptions, and Zod schemas for input validation.
2.  **Service Layer (`src/services/`):** Contains business logic, orchestrates repository calls, and handles complex operations like Optimistic Concurrency Control (OCC).
3.  **Repository Layer (`src/repositories/`):** Provides an abstraction over the Taiga HTTP API. Uses a generic `BaseRepository` for standard CRUD operations.
4.  **HTTP Client Layer (`src/http/`):** Custom Axios instance (`TaigaHttpClient.ts`) with interceptors for auth headers, token refresh, and error handling.
5.  **Auth Layer (`src/auth/`):** Manages JWT tokens, token refreshing, and supports both "normal" and "ldap" authentication.

## Building and Running

### Prerequisites
- Node.js 20+
- A Taiga account (normal or LDAP)

### Setup
```bash
npm install
cp .env.example .env
# Configure TAIGA_HOST, TAIGA_USERNAME, TAIGA_PASSWORD in .env
```

### Key Commands
- **Build:** `npm run build` (transpiles TypeScript to `dist/`)
- **Run Server:** `npm run start` (runs `dist/index.js`)
- **Development:** `npm run dev` (uses `tsx` to run `src/index.ts` directly)
- **Test:** `npm run test` (executes Vitest suite)
- **Lint:** `npm run lint` (runs ESLint)

## Development Conventions

### Coding Standards
- **SOLID Principles:** Each class has a single responsibility.
- **Repository Pattern:** Every Taiga entity must have its own repository extending `BaseRepository`.
- **Service Layer Pattern:** Business logic and validations MUST reside in services, never in the MCP handlers or repositories.
- **DRY (Don't Repeat Yourself):** Use `BaseRepository<T>` for common CRUD operations.
- **Tell Don't Ask:** Services should orchestrate actions (e.g., `changeStatus`) and manage state (like versions) internally.

### Error Handling
The server uses a structured error handling approach:
- **401 Unauthorized:** Automatically triggers token refresh and retries the request.
- **409 OCC Conflict:** Throws `OCCConflictError`, providing a hint to the LLM to fetch the latest version and retry.
- **429 Rate Limit:** Automatically waits for `retry-after` header and retries.
- **General Errors:** Wrapped in `TaigaAPIError` with descriptive messages for the LLM.

### Optimistic Concurrency Control (OCC)
Taiga uses versions for many entities. When editing resources (Epics, US, Tasks, etc.), the `version` field must be provided to avoid overwriting changes from other users. Services handle this by ensuring versions are passed to the repositories.

### Adding New Tools
1. Define the input schema in the corresponding `src/tools/*.tools.ts` file.
2. Add the business logic to the relevant service in `src/services/`.
3. If necessary, add new endpoints to the repository in `src/repositories/`.
4. Register the tool handler in `src/index.ts` within the `handleToolCall` function and `allToolSchemas` registry.
