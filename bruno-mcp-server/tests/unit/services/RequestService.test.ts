import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestService } from "../../../src/services/RequestService.js";
import type { RequestRepository } from "../../../src/repositories/RequestRepository.js";
import type { RequestResponseDTO } from "../../../src/dto/request/RequestDTO.js";

const mockRequest: RequestResponseDTO = {
  file_path: "/col/auth/login.bru",
  name: "Login",
  method: "POST",
  url: "{{baseUrl}}/api/login",
  seq: 1,
  body_type: "json",
  body: { username: "{{user}}", password: "{{pass}}" },
  headers: { "Content-Type": "application/json" },
  params_query: {},
  auth: { type: "none" },
  vars_pre: {},
  vars_post: { authToken: "res.body.auth_token" },
  assertions: [{ expression: "res.status", operator: "eq", value: 200, enabled: true }],
  script_pre: "",
  script_post: 'bru.setEnvVar("authToken", res.body.auth_token);',
  tests: 'test("status 200", () => { expect(res.status).to.equal(200); });',
  docs: "Login endpoint",
  raw_bru: "",
};

function makeMockRepo(): RequestRepository {
  return {
    get: vi.fn().mockResolvedValue(mockRequest),
    create: vi.fn().mockResolvedValue(mockRequest),
    update: vi.fn().mockResolvedValue(mockRequest),
    delete: vi.fn().mockResolvedValue(undefined),
    clone: vi.fn().mockResolvedValue(mockRequest),
    list: vi.fn().mockResolvedValue([mockRequest]),
    setHeader: vi.fn().mockResolvedValue(mockRequest),
    removeHeader: vi.fn().mockResolvedValue(mockRequest),
    setQueryParam: vi.fn().mockResolvedValue(mockRequest),
    setDocs: vi.fn().mockResolvedValue(mockRequest),
    reorder: vi.fn().mockResolvedValue(undefined),
  } as unknown as RequestRepository;
}

describe("RequestService", () => {
  let service: RequestService;
  let repo: RequestRepository;

  beforeEach(() => {
    repo = makeMockRepo();
    service = new RequestService(repo);
  });

  describe("getRequest", () => {
    it("should delegate to repository.get", async () => {
      const result = await service.getRequest("/col/auth/login.bru");
      expect(repo.get).toHaveBeenCalledWith("/col/auth/login.bru");
      expect(result.name).toBe("Login");
    });
  });

  describe("createRequest", () => {
    it("should delegate to repository.create with DTO", async () => {
      const dto = { collection_path: "/col", name: "Login", method: "POST" as const, url: "{{baseUrl}}/api/login" };
      await service.createRequest(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("setAuth (Tell Don't Ask)", () => {
    it("should tell repository to update auth without checking current state", async () => {
      await service.setAuth("/col/auth/login.bru", { type: "bearer", token: "{{authToken}}" });
      expect(repo.update).toHaveBeenCalledWith("/col/auth/login.bru", { auth: { type: "bearer", token: "{{authToken}}" } });
    });
  });

  describe("addAssertion", () => {
    it("should merge new assertion into existing list", async () => {
      const newAssertion = { expression: "res.body.id", operator: "isDefined" as const, enabled: true };
      await service.addAssertion("/col/auth/login.bru", newAssertion);
      expect(repo.update).toHaveBeenCalledWith(
        "/col/auth/login.bru",
        expect.objectContaining({ assertions: expect.arrayContaining([newAssertion]) })
      );
    });
  });

  describe("validateScript", () => {
    it("should return valid for correct JavaScript", () => {
      const result = service.validateScript('const x = 1; bru.setVar("key", x);');
      expect(result.valid).toBe(true);
    });

    it("should return invalid for syntax errors", () => {
      const result = service.validateScript("const x = {{{;");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("toggleAssertion", () => {
    it("should toggle enabled flag at given index", async () => {
      await service.toggleAssertion("/col/auth/login.bru", 0, false);
      expect(repo.update).toHaveBeenCalledWith(
        "/col/auth/login.bru",
        expect.objectContaining({
          assertions: expect.arrayContaining([expect.objectContaining({ enabled: false })]),
        })
      );
    });
  });

  describe("clearAssertions", () => {
    it("should call update with empty assertions array", async () => {
      await service.clearAssertions("/col/auth/login.bru");
      expect(repo.update).toHaveBeenCalledWith("/col/auth/login.bru", { assertions: [] });
    });
  });
});
