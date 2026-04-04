import { z } from "zod";
import { success, failure } from "../dto/common/index.js";
import type { CollectionService } from "../services/CollectionService.js";
import type { Config } from "../config/config.js";
import { assertPathAllowed } from "../utils/path.js";

export function registerCollectionTools(
  server: { tool: (name: string, desc: string, schema: object, handler: (args: unknown) => Promise<{ content: { type: string; text: string }[] }>) => void },
  collectionService: CollectionService,
  config: Config
) {
  // ─── bruno_collection_create ───────────────────────────────────────
  server.tool(
    "bruno_collection_create",
    "Creates a new Bruno collection on the filesystem with bruno.json, environments/ directory, and .gitignore.",
    z.object({
      name: z.string().min(1).describe("Collection name"),
      path: z.string().describe("Parent directory where the collection folder will be created"),
      scripts_config: z.object({
        moduleWhitelist: z.array(z.string()).optional(),
        filesystemAccess: z.object({ allow: z.boolean() }).optional(),
        flow: z.enum(["sandwich", "sequential"]).optional(),
      }).optional(),
      presets: z.object({
        requestType: z.string().optional(),
        requestUrl: z.string().optional(),
      }).optional(),
      ignore: z.array(z.string()).optional(),
    }).shape,
    async (args) => {
      const dto = args as { name: string; path: string; scripts_config?: object; presets?: object; ignore?: string[] };
      try {
        assertPathAllowed(dto.path, config);
        const result = await collectionService.createCollection(dto as Parameters<typeof collectionService.createCollection>[0]);
        return respond(success(result, { path: result.path, operation: "bruno_collection_create" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_collection_get ──────────────────────────────────────────
  server.tool(
    "bruno_collection_get",
    "Reads metadata and structure of an existing Bruno collection (bruno.json).",
    z.object({
      collection_path: z.string().describe("Absolute path to the collection root"),
    }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await collectionService.getCollection(collection_path);
        return respond(success(result, { path: collection_path, operation: "bruno_collection_get" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_collection_list ─────────────────────────────────────────
  server.tool(
    "bruno_collection_list",
    "Lists all Bruno collections found in a base directory.",
    z.object({
      base_path: z.string().describe("Base directory to search for collections"),
    }).shape,
    async (args) => {
      const { base_path } = args as { base_path: string };
      try {
        assertPathAllowed(base_path, config);
        const result = await collectionService.listCollections(base_path);
        return respond(success(result, { path: base_path, operation: "bruno_collection_list" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_collection_update ───────────────────────────────────────
  server.tool(
    "bruno_collection_update",
    "Updates the bruno.json configuration of an existing collection.",
    z.object({
      collection_path: z.string(),
      config: z.object({
        name: z.string().optional(),
        scripts_config: z.object({
          moduleWhitelist: z.array(z.string()).optional(),
          filesystemAccess: z.object({ allow: z.boolean() }).optional(),
          flow: z.enum(["sandwich", "sequential"]).optional(),
        }).optional(),
        presets: z.object({ requestType: z.string().optional(), requestUrl: z.string().optional() }).optional(),
        ignore: z.array(z.string()).optional(),
      }),
    }).shape,
    async (args) => {
      const { collection_path, config: cfg } = args as { collection_path: string; config: object };
      try {
        assertPathAllowed(collection_path, config);
        const result = await collectionService.updateCollection(collection_path, cfg as Parameters<typeof collectionService.updateCollection>[1]);
        return respond(success(result, { path: collection_path, operation: "bruno_collection_update" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_collection_delete ───────────────────────────────────────
  server.tool(
    "bruno_collection_delete",
    "Permanently deletes a Bruno collection and all its files from the filesystem.",
    z.object({
      collection_path: z.string(),
    }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        await collectionService.deleteCollection(collection_path);
        return respond(success({ deleted: true }, { path: collection_path, operation: "bruno_collection_delete" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_collection_tree ─────────────────────────────────────────
  server.tool(
    "bruno_collection_tree",
    "Returns the full folder/request tree of a Bruno collection.",
    z.object({
      collection_path: z.string(),
    }).shape,
    async (args) => {
      const { collection_path } = args as { collection_path: string };
      try {
        assertPathAllowed(collection_path, config);
        const result = await collectionService.getCollectionTree(collection_path);
        return respond(success(result, { path: collection_path, operation: "bruno_collection_tree" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_folder_create ───────────────────────────────────────────
  server.tool(
    "bruno_folder_create",
    "Creates a new folder inside a collection with a folder.bru file.",
    z.object({
      collection_path: z.string(),
      folder_name: z.string().min(1),
      parent_path: z.string().optional().describe("Relative path from collection root (optional)"),
    }).shape,
    async (args) => {
      const dto = args as { collection_path: string; folder_name: string; parent_path?: string };
      try {
        assertPathAllowed(dto.collection_path, config);
        const result = await collectionService.createFolder(dto);
        return respond(success(result, { path: result.path, operation: "bruno_folder_create" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_folder_get ──────────────────────────────────────────────
  server.tool(
    "bruno_folder_get",
    "Reads the folder.bru configuration of a folder (auth, headers, scripts).",
    z.object({ folder_path: z.string() }).shape,
    async (args) => {
      const { folder_path } = args as { folder_path: string };
      try {
        assertPathAllowed(folder_path, config);
        const result = await collectionService.getFolder(folder_path);
        return respond(success(result, { path: folder_path, operation: "bruno_folder_get" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_folder_update ───────────────────────────────────────────
  server.tool(
    "bruno_folder_update",
    "Updates the folder.bru config (auth, headers, scripts).",
    z.object({
      folder_path: z.string(),
      config: z.object({
        auth: z.object({ type: z.string() }).passthrough().optional(),
        headers: z.record(z.string()).optional(),
        script_pre: z.string().optional(),
        script_post: z.string().optional(),
      }),
    }).shape,
    async (args) => {
      const { folder_path, config: cfg } = args as { folder_path: string; config: object };
      try {
        assertPathAllowed(folder_path, config);
        const result = await collectionService.updateFolder(folder_path, cfg as Parameters<typeof collectionService.updateFolder>[1]);
        return respond(success(result, { path: folder_path, operation: "bruno_folder_update" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );

  // ─── bruno_folder_delete ───────────────────────────────────────────
  server.tool(
    "bruno_folder_delete",
    "Deletes a folder and all its .bru request files.",
    z.object({ folder_path: z.string() }).shape,
    async (args) => {
      const { folder_path } = args as { folder_path: string };
      try {
        assertPathAllowed(folder_path, config);
        await collectionService.deleteFolder(folder_path);
        return respond(success({ deleted: true }, { path: folder_path, operation: "bruno_folder_delete" }));
      } catch (err) {
        return respondError(err);
      }
    }
  );
}

// ─── Shared response helpers ───────────────────────────────────────────────
function respond(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function respondError(err: unknown) {
  const e = err as { code?: string; message?: string; path?: string };
  return respond(
    failure(
      (e.code as Parameters<typeof failure>[0]) ?? "UNKNOWN_ERROR",
      e.message ?? "Unknown error",
      { path: e.path }
    )
  );
}
