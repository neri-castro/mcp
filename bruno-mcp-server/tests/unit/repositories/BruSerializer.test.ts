import { describe, it, expect } from "vitest";
import { BruSerializer } from "../../../src/bru/BruSerializer.js";

describe("BruSerializer", () => {
  const serializer = new BruSerializer();

  describe("serializeRequest", () => {
    it("should produce a valid .bru file with meta and method block", () => {
      const result = serializer.serializeRequest({
        collection_path: "/col",
        name: "Get Users",
        method: "GET",
        url: "{{baseUrl}}/api/users",
        seq: 1,
      });
      expect(result).toContain("meta {");
      expect(result).toContain("name: Get Users");
      expect(result).toContain("seq: 1");
      expect(result).toContain("get {");
      expect(result).toContain("url: {{baseUrl}}/api/users");
    });

    it("should include body:json block for POST with json body", () => {
      const result = serializer.serializeRequest({
        collection_path: "/col",
        name: "Login",
        method: "POST",
        url: "{{baseUrl}}/api/login",
        body_type: "json",
        body: { username: "{{user}}" },
      });
      expect(result).toContain("body:json {");
      expect(result).toContain('"username"');
    });

    it("should include auth:bearer block", () => {
      const result = serializer.serializeRequest({
        collection_path: "/col",
        name: "Protected",
        method: "GET",
        url: "{{baseUrl}}/api/me",
        auth: { type: "bearer", token: "{{authToken}}" },
      });
      expect(result).toContain("auth:bearer {");
      expect(result).toContain("token: {{authToken}}");
    });

    it("should include assert block with assertions", () => {
      const result = serializer.serializeRequest({
        collection_path: "/col",
        name: "With Assertions",
        method: "GET",
        url: "{{baseUrl}}/api/test",
        assertions: [
          { expression: "res.status", operator: "eq", value: 200, enabled: true },
          { expression: "res.body.id", operator: "isDefined", enabled: true },
        ],
      });
      expect(result).toContain("assert {");
      expect(result).toContain("res.status: eq 200");
      expect(result).toContain("res.body.id: isDefined");
    });

    it("should prefix disabled assertions with ~", () => {
      const result = serializer.serializeRequest({
        collection_path: "/col",
        name: "Partial",
        method: "GET",
        url: "{{baseUrl}}/api",
        assertions: [{ expression: "res.status", operator: "eq", value: 200, enabled: false }],
      });
      expect(result).toContain("~res.status: eq 200");
    });

    it("should include vars:post-response block", () => {
      const result = serializer.serializeRequest({
        collection_path: "/col",
        name: "Extract Token",
        method: "POST",
        url: "{{baseUrl}}/api/login",
        vars_post: { authToken: "res.body.auth_token" },
      });
      expect(result).toContain("vars:post-response {");
      expect(result).toContain("authToken: res.body.auth_token");
    });
  });

  describe("serializeEnvironment", () => {
    it("should produce vars block and vars:secret list", () => {
      const result = serializer.serializeEnvironment(
        { baseUrl: "http://localhost:3000", username: "dev" },
        ["password", "apiKey"]
      );
      expect(result).toContain("vars {");
      expect(result).toContain("baseUrl: http://localhost:3000");
      expect(result).toContain("vars:secret [");
      expect(result).toContain("password,");
      expect(result).toContain("apiKey,");
    });

    it("should exclude secret keys from vars block", () => {
      const result = serializer.serializeEnvironment(
        { baseUrl: "http://localhost", secret: "s3cr3t" },
        ["secret"]
      );
      expect(result).not.toContain("secret: s3cr3t");
      expect(result).toContain("secret,");
    });
  });

  describe("serializeFolderBru", () => {
    it("should produce meta block with folder name", () => {
      const result = serializer.serializeFolderBru({ name: "auth" });
      expect(result).toContain("meta {");
      expect(result).toContain("name: auth");
    });

    it("should include auth:bearer block when configured", () => {
      const result = serializer.serializeFolderBru({
        name: "protected",
        auth: { type: "bearer", token: "{{authToken}}" },
      });
      expect(result).toContain("auth:bearer {");
      expect(result).toContain("token: {{authToken}}");
    });
  });
});
