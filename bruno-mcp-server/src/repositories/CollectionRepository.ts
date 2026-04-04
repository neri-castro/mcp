import path from "path";
import fs from "fs/promises";
import { glob } from "glob";
import { BaseFileRepository } from "./base/BaseFileRepository.js";
import type { BruParser } from "../bru/BruParser.js";
import type { BruSerializer } from "../bru/BruSerializer.js";
import type {
  CollectionDTO,
  CollectionSummaryDTO,
  CollectionTreeDTO,
  CollectionTreeNode,
  CreateCollectionDTO,
  UpdateCollectionDTO,
  CreateFolderDTO,
  FolderConfigDTO,
} from "../dto/collection/CollectionDTO.js";

export class CollectionRepository extends BaseFileRepository<Record<string, unknown>> {
  constructor(parser: BruParser, serializer: BruSerializer) {
    super(parser, serializer);
  }

  async create(dto: CreateCollectionDTO): Promise<CollectionDTO> {
    const collPath = path.join(dto.path, dto.name);
    await fs.mkdir(collPath, { recursive: true });
    await fs.mkdir(path.join(collPath, "environments"), { recursive: true });

    const brunoJson = {
      version: "1",
      name: dto.name,
      type: "collection",
      ignore: dto.ignore ?? ["node_modules", ".git"],
      scripts: {
        moduleWhitelist: dto.scripts_config?.moduleWhitelist ?? ["crypto", "buffer"],
        filesystemAccess: dto.scripts_config?.filesystemAccess ?? { allow: false },
        flow: dto.scripts_config?.flow ?? "sandwich",
      },
      presets: dto.presets ?? { requestType: "http", requestUrl: "{{baseUrl}}" },
    };

    await this.writeJson(path.join(collPath, "bruno.json"), brunoJson);

    // Generate .gitignore
    const gitignore = ".env\nnode_modules/\n*.log\n";
    await this.writeFile(path.join(collPath, ".gitignore"), gitignore);

    return { name: dto.name, path: collPath, bruno_json: brunoJson };
  }

  async get(collectionPath: string): Promise<CollectionDTO> {
    const brunoJsonPath = path.join(collectionPath, "bruno.json");
    const brunoJson = await this.readJson(brunoJsonPath);
    return { name: brunoJson["name"] as string, path: collectionPath, bruno_json: brunoJson };
  }

  async list(basePath: string): Promise<CollectionSummaryDTO[]> {
    const brunoJsonPaths = await glob(path.join(basePath, "*/bruno.json"));
    const summaries: CollectionSummaryDTO[] = [];

    for (const bjPath of brunoJsonPaths) {
      const collPath = path.dirname(bjPath);
      const brunoJson = await this.readJson(bjPath);
      const requests = await glob(path.join(collPath, "**/*.bru"));
      const folders = await glob(path.join(collPath, "**/"));
      const envs = await glob(path.join(collPath, "environments/*.bru"));

      summaries.push({
        name: brunoJson["name"] as string,
        path: collPath,
        request_count: requests.filter((r) => !r.includes("/environments/")).length,
        folder_count: folders.length - 1,
        env_count: envs.length,
      });
    }
    return summaries;
  }

  async update(collectionPath: string, dto: UpdateCollectionDTO): Promise<CollectionDTO> {
    const bjPath = path.join(collectionPath, "bruno.json");
    const current = await this.readJson(bjPath);

    const updated = {
      ...current,
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.ignore ? { ignore: dto.ignore } : {}),
      ...(dto.scripts_config
        ? {
            scripts: {
              ...(current["scripts"] as Record<string, unknown>),
              ...(dto.scripts_config.moduleWhitelist
                ? { moduleWhitelist: dto.scripts_config.moduleWhitelist }
                : {}),
              ...(dto.scripts_config.filesystemAccess
                ? { filesystemAccess: dto.scripts_config.filesystemAccess }
                : {}),
              ...(dto.scripts_config.flow ? { flow: dto.scripts_config.flow } : {}),
            },
          }
        : {}),
      ...(dto.presets ? { presets: dto.presets } : {}),
    };

    await this.writeJson(bjPath, updated);
    return { name: updated["name"] as string, path: collectionPath, bruno_json: updated };
  }

  async delete(collectionPath: string): Promise<void> {
    await this.deleteDirectory(collectionPath);
  }

  async getTree(collectionPath: string): Promise<CollectionTreeDTO> {
    const brunoJson = await this.readJson(path.join(collectionPath, "bruno.json"));

    const buildTree = async (dirPath: string): Promise<CollectionTreeNode[]> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const nodes: CollectionTreeNode[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && !["environments", "node_modules", ".git"].includes(entry.name)) {
          const children = await buildTree(fullPath);
          nodes.push({ name: entry.name, path: fullPath, type: "folder", children });
        } else if (entry.isFile() && entry.name.endsWith(".bru") && entry.name !== "folder.bru") {
          const raw = await this.readRaw(fullPath);
          const methodMatch = raw.match(/^(get|post|put|patch|delete|options|head)\s*\{/im);
          const seqMatch = raw.match(/seq:\s*(\d+)/);
          nodes.push({
            name: entry.name.replace(".bru", ""),
            path: fullPath,
            type: "request",
            method: methodMatch?.[1]?.toUpperCase(),
            seq: seqMatch ? parseInt(seqMatch[1]) : undefined,
          });
        }
      }
      return nodes.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
    };

    const tree = await buildTree(collectionPath);
    return { name: brunoJson["name"] as string, path: collectionPath, tree };
  }

  async createFolder(dto: CreateFolderDTO): Promise<FolderConfigDTO> {
    const basePath = dto.parent_path
      ? path.join(dto.collection_path, dto.parent_path, dto.folder_name)
      : path.join(dto.collection_path, dto.folder_name);

    await fs.mkdir(basePath, { recursive: true });

    const folderBruContent = this.serializer.serializeFolderBru({ name: dto.folder_name });
    await this.writeFile(path.join(basePath, "folder.bru"), folderBruContent);

    return { name: dto.folder_name, path: basePath };
  }

  async getFolder(folderPath: string): Promise<FolderConfigDTO> {
    const folderBruPath = path.join(folderPath, "folder.bru");
    const raw = await this.readRaw(folderBruPath);
    const parsed = this.parser.parse(raw);
    const name = path.basename(folderPath);
    return { name, path: folderPath, ...(parsed as Partial<FolderConfigDTO>) };
  }

  async updateFolder(
    folderPath: string,
    config: Partial<FolderConfigDTO>
  ): Promise<FolderConfigDTO> {
    const folderBruPath = path.join(folderPath, "folder.bru");
    const current = await this.getFolder(folderPath);
    const merged = { ...current, ...config };
    const content = this.serializer.serializeFolderBru(merged);
    await this.writeFile(folderBruPath, content);
    return merged as FolderConfigDTO;
  }

  async deleteFolder(folderPath: string): Promise<void> {
    await this.deleteDirectory(folderPath);
  }
}
