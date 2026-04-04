import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaConverter } from '../../../src/utils/schema-converter.js';
import type { SchemaDTO } from '../../../src/openapi/dto/OpenApiDocumentDTO.js';

describe('SchemaConverter', () => {
  let converter: SchemaConverter;

  beforeEach(() => {
    converter = new SchemaConverter();
  });

  describe('jsonSchemaToZod - string types', () => {
    it('converts plain string', () => {
      const schema: SchemaDTO = { type: 'string' };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse('hello')).toBe('hello');
      expect(() => zod.parse(123)).toThrow();
    });

    it('converts email format', () => {
      const schema: SchemaDTO = { type: 'string', format: 'email' };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse('test@example.com')).toBe('test@example.com');
      expect(() => zod.parse('not-an-email')).toThrow();
    });

    it('converts uuid format', () => {
      const schema: SchemaDTO = { type: 'string', format: 'uuid' };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse('550e8400-e29b-41d4-a716-446655440000')).toBeDefined();
      expect(() => zod.parse('not-a-uuid')).toThrow();
    });

    it('converts string with minLength/maxLength', () => {
      const schema: SchemaDTO = { type: 'string', minLength: 2, maxLength: 10 };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse('hello')).toBe('hello');
      expect(() => zod.parse('a')).toThrow();
      expect(() => zod.parse('toolongstring')).toThrow();
    });

    it('converts enum string', () => {
      const schema: SchemaDTO = { type: 'string', enum: ['active', 'inactive', 'pending'] };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse('active')).toBe('active');
      expect(() => zod.parse('other')).toThrow();
    });

    it('converts nullable string', () => {
      const schema: SchemaDTO = { type: 'string', nullable: true };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse(null)).toBeNull();
      expect(zod.parse('hello')).toBe('hello');
    });
  });

  describe('jsonSchemaToZod - number types', () => {
    it('converts integer with min/max', () => {
      const schema: SchemaDTO = { type: 'integer', minimum: 1, maximum: 100 };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse(50)).toBe(50);
      expect(() => zod.parse(0)).toThrow();
      expect(() => zod.parse(101)).toThrow();
    });

    it('converts plain number', () => {
      const schema: SchemaDTO = { type: 'number' };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse(3.14)).toBe(3.14);
    });
  });

  describe('jsonSchemaToZod - object types', () => {
    it('converts object with required and optional fields', () => {
      const schema: SchemaDTO = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      };

      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse({ name: 'John', email: 'john@example.com' })).toBeDefined();
      expect(() => zod.parse({ name: 'John' })).toThrow(); // email required
    });

    it('converts nested object', () => {
      const schema: SchemaDTO = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name'],
          },
        },
        required: ['user'],
      };

      const zod = converter.jsonSchemaToZod(schema);
      const result = zod.parse({ user: { name: 'John', email: 'john@test.com' } });
      expect((result as Record<string, unknown>)['user']).toBeDefined();
    });
  });

  describe('jsonSchemaToZod - array types', () => {
    it('converts array of strings', () => {
      const schema: SchemaDTO = { type: 'array', items: { type: 'string' } };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('resolveRef', () => {
    it('resolves $ref from components.schemas', () => {
      converter.setSchemas({
        UserResource: {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
          required: ['id', 'name'],
        },
      });

      const schema: SchemaDTO = { $ref: '#/components/schemas/UserResource' };
      const zod = converter.jsonSchemaToZod(schema);
      expect(zod.parse({ id: 1, name: 'John' })).toBeDefined();
    });
  });

  describe('buildInputSchemaFromOperation', () => {
    it('builds schema from parameters and requestBody', () => {
      const parameters = [
        { name: 'page', required: false, schema: { type: 'integer' } as SchemaDTO, in: 'query' as const },
        { name: 'per_page', required: false, schema: { type: 'integer' } as SchemaDTO, in: 'query' as const },
      ];

      const requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' } as SchemaDTO,
                email: { type: 'string', format: 'email' } as SchemaDTO,
              },
              required: ['name', 'email'],
            } as SchemaDTO,
          },
        },
      };

      const schema = converter.buildInputSchemaFromOperation(parameters, requestBody);
      const result = schema.parse({ name: 'John', email: 'john@test.com', page: 1 });
      expect(result).toBeDefined();
    });
  });
});
