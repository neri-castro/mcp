import { describe, it, expect } from 'vitest';
import { OpenApiParser } from '../../../src/openapi/OpenApiParser.js';
import type { OpenApiDocumentDTO } from '../../../src/openapi/dto/OpenApiDocumentDTO.js';

const mockDocument: OpenApiDocumentDTO = {
  openapi: '3.1.0',
  info: { title: 'Blog API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/api/posts': {
      get: {
        operationId: 'posts.index',
        tags: ['Posts'],
        summary: 'List all posts',
        parameters: [
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 15 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthenticated' },
        },
        security: [{ bearerAuth: [] }],
      },
      post: {
        operationId: 'posts.store',
        tags: ['Posts'],
        summary: 'Create post',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                },
                required: ['title', 'content'],
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/posts/{post}': {
      get: {
        operationId: 'posts.show',
        tags: ['Posts'],
        summary: 'Get post',
        parameters: [{ name: 'post', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/health': {
      get: {
        operationId: 'health.check',
        tags: ['Health'],
        summary: 'Health check',
        parameters: [],
        responses: { '200': { description: 'OK' } },
        security: [], // @unauthenticated
      },
    },
  },
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
};

describe('OpenApiParser', () => {
  const parser = new OpenApiParser();

  describe('parseOperations', () => {
    it('extracts all operations from paths', () => {
      const operations = parser.parseOperations(mockDocument);
      expect(operations.length).toBe(4); // index, store, show, health
    });

    it('marks authenticated operations correctly', () => {
      const operations = parser.parseOperations(mockDocument);
      const health = operations.find((o) => o.operation.operationId === 'health.check');
      const posts = operations.find((o) => o.operation.operationId === 'posts.index');

      expect(health?.requiresAuth).toBe(false);
      expect(posts?.requiresAuth).toBe(true);
    });

    it('detects multipart content type for file uploads', () => {
      const docWithUpload: OpenApiDocumentDTO = {
        ...mockDocument,
        paths: {
          '/api/upload': {
            post: {
              operationId: 'upload.file',
              tags: ['Upload'],
              parameters: [],
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: { file: { type: 'string', format: 'binary' } },
                    },
                  },
                },
              },
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      };

      const operations = parser.parseOperations(docWithUpload);
      expect(operations[0]?.contentType).toBe('multipart/form-data');
    });
  });

  describe('parseAuthConfig', () => {
    it('detects bearer JWT authentication', () => {
      const authConfig = parser.parseAuthConfig(mockDocument);
      expect(authConfig?.type).toBe('bearer');
      expect(authConfig?.bearerFormat).toBe('JWT');
    });

    it('detects API key authentication', () => {
      const doc: OpenApiDocumentDTO = {
        ...mockDocument,
        components: {
          ...mockDocument.components,
          securitySchemes: {
            apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
          },
        },
      };

      const authConfig = parser.parseAuthConfig(doc);
      expect(authConfig?.type).toBe('apiKey');
      expect(authConfig?.name).toBe('X-API-Key');
    });

    it('returns null when no security schemes', () => {
      const doc: OpenApiDocumentDTO = {
        ...mockDocument,
        components: { schemas: {}, securitySchemes: {} },
      };

      const authConfig = parser.parseAuthConfig(doc);
      expect(authConfig).toBeNull();
    });
  });

  describe('parseTags', () => {
    it('extracts unique tags from all operations', () => {
      const tags = parser.parseTags(mockDocument);
      expect(tags).toContain('Posts');
      expect(tags).toContain('Health');
      expect(tags.length).toBe(2);
    });
  });
});
