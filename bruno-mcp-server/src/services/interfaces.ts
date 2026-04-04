import type { CollectionDTO, CollectionSummaryDTO, CollectionTreeDTO, CreateCollectionDTO, UpdateCollectionDTO, CreateFolderDTO, FolderConfigDTO } from "../dto/collection/CollectionDTO.js";
import type { RequestResponseDTO, CreateRequestDTO, UpdateRequestDTO } from "../dto/request/RequestDTO.js";
import type { EnvironmentDTO, CreateEnvironmentDTO, UpdateEnvironmentDTO } from "../dto/environment/EnvironmentDTO.js";
import type { RunResultDTO, RunOptionsDTO, RequestRunResultDTO } from "../dto/runner/RunnerDTO.js";
import type { AuthConfigDTO } from "../dto/auth/AuthConfigDTO.js";
import type { AssertionDTO } from "../dto/test/AssertionDTO.js";

// ─── Collection interfaces ─────────────────────────────────────────────────
export interface ICollectionReader {
  getCollection(collectionPath: string): Promise<CollectionDTO>;
  listCollections(basePath: string): Promise<CollectionSummaryDTO[]>;
  getCollectionTree(collectionPath: string): Promise<CollectionTreeDTO>;
}

export interface ICollectionWriter {
  createCollection(dto: CreateCollectionDTO): Promise<CollectionDTO>;
  updateCollection(collectionPath: string, dto: UpdateCollectionDTO): Promise<CollectionDTO>;
  deleteCollection(collectionPath: string): Promise<void>;
}

export interface IFolderManager {
  createFolder(dto: CreateFolderDTO): Promise<FolderConfigDTO>;
  getFolder(folderPath: string): Promise<FolderConfigDTO>;
  updateFolder(folderPath: string, config: Partial<FolderConfigDTO>): Promise<FolderConfigDTO>;
  deleteFolder(folderPath: string): Promise<void>;
}

// ─── Request interfaces ────────────────────────────────────────────────────
export interface IRequestReader {
  getRequest(requestPath: string): Promise<RequestResponseDTO>;
  listRequests(folderPath: string): Promise<RequestResponseDTO[]>;
}

export interface IRequestWriter {
  createRequest(dto: CreateRequestDTO): Promise<RequestResponseDTO>;
  updateRequest(requestPath: string, dto: UpdateRequestDTO): Promise<RequestResponseDTO>;
  deleteRequest(requestPath: string): Promise<void>;
  cloneRequest(requestPath: string, newName: string, targetFolder: string): Promise<RequestResponseDTO>;
}

export interface IRequestHeaderManager {
  setHeader(requestPath: string, key: string, value: string, enabled?: boolean): Promise<RequestResponseDTO>;
  removeHeader(requestPath: string, key: string): Promise<RequestResponseDTO>;
  setQueryParam(requestPath: string, key: string, value: string, enabled?: boolean): Promise<RequestResponseDTO>;
  setBody(requestPath: string, bodyType: string, body: unknown): Promise<RequestResponseDTO>;
  setDocs(requestPath: string, markdownContent: string): Promise<RequestResponseDTO>;
  reorder(folderPath: string, requestNamesOrdered: string[]): Promise<void>;
}

// ─── Environment interfaces ────────────────────────────────────────────────
export interface IEnvironmentManager {
  listEnvironments(collectionPath: string): Promise<string[]>;
  createEnvironment(dto: CreateEnvironmentDTO): Promise<EnvironmentDTO>;
  getEnvironment(collectionPath: string, envName: string): Promise<EnvironmentDTO>;
  updateEnvironment(collectionPath: string, envName: string, dto: UpdateEnvironmentDTO): Promise<EnvironmentDTO>;
  deleteEnvironment(collectionPath: string, envName: string): Promise<void>;
  setVariable(collectionPath: string, envName: string, key: string, value: string, isSecret?: boolean): Promise<EnvironmentDTO>;
  removeVariable(collectionPath: string, envName: string, key: string): Promise<EnvironmentDTO>;
  markSecret(collectionPath: string, envName: string, keys: string[]): Promise<EnvironmentDTO>;
  interpolate(template: string, vars: Record<string, string>): string;
}

// ─── Auth interfaces ───────────────────────────────────────────────────────
export interface IAuthManager {
  setAuth(targetPath: string, auth: AuthConfigDTO): Promise<void>;
  getAuth(targetPath: string): Promise<AuthConfigDTO>;
}

// ─── Script interfaces ─────────────────────────────────────────────────────
export interface IScriptManager {
  setPreRequestScript(targetPath: string, scriptJs: string): Promise<void>;
  setPostResponseScript(targetPath: string, scriptJs: string): Promise<void>;
  getScripts(targetPath: string): Promise<{ pre: string; post: string }>;
  clearScript(targetPath: string, type: "pre" | "post"): Promise<void>;
  validateScript(scriptJs: string): { valid: boolean; error?: string };
}

// ─── Test interfaces ───────────────────────────────────────────────────────
export interface ITestManager {
  addAssertion(requestPath: string, assertion: AssertionDTO): Promise<void>;
  listAssertions(requestPath: string): Promise<AssertionDTO[]>;
  removeAssertion(requestPath: string, index: number): Promise<void>;
  toggleAssertion(requestPath: string, index: number, enabled: boolean): Promise<void>;
  clearAssertions(requestPath: string): Promise<void>;
  setTests(requestPath: string, testsJs: string): Promise<void>;
  getTests(requestPath: string): Promise<string>;
  clearTests(requestPath: string): Promise<void>;
  validateTestSyntax(testsJs: string): { valid: boolean; error?: string };
}

// ─── Runner interfaces ─────────────────────────────────────────────────────
export interface IRequestRunner {
  runCollection(collectionPath: string, options: RunOptionsDTO): Promise<RunResultDTO>;
  runFolder(folderPath: string, options: RunOptionsDTO): Promise<RunResultDTO>;
  runRequest(requestPath: string, envName: string, envOverrides?: Record<string, string>): Promise<RequestRunResultDTO>;
}
