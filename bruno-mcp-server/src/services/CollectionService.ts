import type { CollectionRepository } from "../repositories/CollectionRepository.js";
import type {
  ICollectionReader,
  ICollectionWriter,
  IFolderManager,
} from "./interfaces.js";
import type {
  CollectionDTO,
  CollectionSummaryDTO,
  CollectionTreeDTO,
  CreateCollectionDTO,
  UpdateCollectionDTO,
  CreateFolderDTO,
  FolderConfigDTO,
} from "../dto/collection/CollectionDTO.js";

/**
 * CollectionService — Orchestrates collection and folder operations.
 * Implements ISP: ICollectionReader, ICollectionWriter, IFolderManager.
 * Tell Don't Ask: callers tell this service what to do; state logic stays here.
 */
export class CollectionService
  implements ICollectionReader, ICollectionWriter, IFolderManager
{
  constructor(private readonly repo: CollectionRepository) {}

  // ─── ICollectionReader ───────────────────────────────────────────────
  async getCollection(collectionPath: string): Promise<CollectionDTO> {
    return this.repo.get(collectionPath);
  }

  async listCollections(basePath: string): Promise<CollectionSummaryDTO[]> {
    return this.repo.list(basePath);
  }

  async getCollectionTree(collectionPath: string): Promise<CollectionTreeDTO> {
    return this.repo.getTree(collectionPath);
  }

  // ─── ICollectionWriter ──────────────────────────────────────────────
  async createCollection(dto: CreateCollectionDTO): Promise<CollectionDTO> {
    return this.repo.create(dto);
  }

  async updateCollection(
    collectionPath: string,
    dto: UpdateCollectionDTO
  ): Promise<CollectionDTO> {
    return this.repo.update(collectionPath, dto);
  }

  async deleteCollection(collectionPath: string): Promise<void> {
    return this.repo.delete(collectionPath);
  }

  // ─── IFolderManager ─────────────────────────────────────────────────
  async createFolder(dto: CreateFolderDTO): Promise<FolderConfigDTO> {
    return this.repo.createFolder(dto);
  }

  async getFolder(folderPath: string): Promise<FolderConfigDTO> {
    return this.repo.getFolder(folderPath);
  }

  async updateFolder(
    folderPath: string,
    config: Partial<FolderConfigDTO>
  ): Promise<FolderConfigDTO> {
    return this.repo.updateFolder(folderPath, config);
  }

  async deleteFolder(folderPath: string): Promise<void> {
    return this.repo.deleteFolder(folderPath);
  }
}
