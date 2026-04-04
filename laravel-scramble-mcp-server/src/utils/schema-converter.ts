import { z } from 'zod';
import type { SchemaDTO, OpenApiDocumentDTO } from '../openapi/dto/OpenApiDocumentDTO.js';

// ──────────────────────────────────────────────────────────────────
// SchemaConverter: convierte JSON Schema de OpenAPI → tipos Zod
// Principio: DRY — lógica centralizada usada por ToolRegistry y Repos
// ──────────────────────────────────────────────────────────────────

export class SchemaConverter {
  private schemas: Record<string, SchemaDTO> = {};

  setSchemas(schemas: Record<string, SchemaDTO>): void {
    this.schemas = schemas;
  }

  /**
   * Resuelve un $ref de OpenAPI a su SchemaDTO correspondiente
   * Ejemplo: "#/components/schemas/UserResource" → SchemaDTO
   */
  resolveRef(ref: string): SchemaDTO {
    const parts = ref.replace('#/', '').split('/');
    // parts = ["components", "schemas", "UserResource"]
    if (parts.length === 3 && parts[0] === 'components' && parts[1] === 'schemas') {
      const schemaName = parts[2]!;
      const resolved = this.schemas[schemaName];
      if (resolved) return resolved;
    }
    return { type: 'object' };
  }

  /**
   * Convierte un SchemaDTO de OpenAPI a un tipo Zod en tiempo de ejecución
   * Soporta: string, integer, number, boolean, array, object, $ref, oneOf, anyOf
   */
  jsonSchemaToZod(schema: SchemaDTO, depth = 0): z.ZodType {
    // Evitar recursión infinita en schemas circulares
    if (depth > 10) return z.unknown();

    // Resolver $ref primero
    if (schema.$ref) {
      const resolved = this.resolveRef(schema.$ref);
      return this.jsonSchemaToZod(resolved, depth + 1);
    }

    // Composición: oneOf / anyOf
    if (schema.oneOf && schema.oneOf.length > 0) {
      const types = schema.oneOf.map((s) => this.jsonSchemaToZod(s, depth + 1));
      return z.union(types as [z.ZodType, z.ZodType, ...z.ZodType[]]);
    }

    if (schema.anyOf && schema.anyOf.length > 0) {
      const types = schema.anyOf.map((s) => this.jsonSchemaToZod(s, depth + 1));
      return z.union(types as [z.ZodType, z.ZodType, ...z.ZodType[]]);
    }

    switch (schema.type) {
      case 'string':
        return this.buildStringSchema(schema);

      case 'integer': {
        let n = z.number().int();
        if (schema.minimum !== undefined) n = n.min(schema.minimum);
        if (schema.maximum !== undefined) n = n.max(schema.maximum);
        if (schema.description) n = n.describe(schema.description);
        return schema.nullable ? n.nullable() : n;
      }

      case 'number': {
        let n = z.number();
        if (schema.minimum !== undefined) n = n.min(schema.minimum);
        if (schema.maximum !== undefined) n = n.max(schema.maximum);
        if (schema.description) n = n.describe(schema.description);
        return schema.nullable ? n.nullable() : n;
      }

      case 'boolean': {
        const b = schema.description ? z.boolean().describe(schema.description) : z.boolean();
        return schema.nullable ? b.nullable() : b;
      }

      case 'array': {
        const itemsZod = schema.items
          ? this.jsonSchemaToZod(schema.items, depth + 1)
          : z.unknown();
        const arr = z.array(itemsZod);
        return schema.nullable ? arr.nullable() : arr;
      }

      case 'object':
        return this.buildObjectSchema(schema, depth);

      default:
        return z.unknown();
    }
  }

  private buildStringSchema(schema: SchemaDTO): z.ZodType {
    // Enum → z.enum
    if (schema.enum && schema.enum.length > 0) {
      const values = schema.enum as [string, ...string[]];
      const e = z.enum(values);
      return schema.nullable ? e.nullable() : e;
    }

    let s = z.string();

    // Formatos específicos de Laravel/OpenAPI
    if (schema.format === 'email') s = s.email();
    else if (schema.format === 'uuid') s = s.uuid();
    else if (schema.format === 'date') s = s.date();
    else if (schema.format === 'date-time') s = s.datetime();
    else if (schema.format === 'uri') s = s.url();

    if (schema.pattern) s = s.regex(new RegExp(schema.pattern));
    if (schema.minLength !== undefined) s = s.min(schema.minLength);
    if (schema.maxLength !== undefined) s = s.max(schema.maxLength);
    if (schema.description) s = s.describe(schema.description);

    return schema.nullable ? s.nullable() : s;
  }

  private buildObjectSchema(schema: SchemaDTO, depth: number): z.ZodType {
    const shape: z.ZodRawShape = {};

    for (const [key, prop] of Object.entries(schema.properties ?? {})) {
      const zodType = this.jsonSchemaToZod(prop, depth + 1);
      const isRequired = schema.required?.includes(key) ?? false;
      shape[key] = isRequired ? zodType : zodType.optional();
    }

    const obj = z.object(shape);
    return schema.nullable ? obj.nullable() : obj;
  }

  /**
   * Genera el schema Zod completo para los inputs de un tool MCP
   * a partir de parameters y requestBody de una operación OpenAPI
   */
  buildInputSchemaFromOperation(
    parameters: Array<{ name: string; required?: boolean; schema: SchemaDTO; description?: string }>,
    requestBody?: {
      required?: boolean;
      content: Record<string, { schema?: SchemaDTO }>;
    },
  ): z.ZodObject<z.ZodRawShape> {
    const shape: z.ZodRawShape = {};

    // Parámetros (path, query, header, cookie)
    for (const param of parameters) {
      const zodType = this.jsonSchemaToZod(param.schema);
      const described = param.description
        ? (zodType as z.ZodTypeAny).describe(param.description)
        : zodType;
      shape[param.name] = param.required ? described : described.optional();
    }

    // Request body (JSON o multipart)
    if (requestBody) {
      const jsonContent =
        requestBody.content['application/json'] ??
        requestBody.content['multipart/form-data'];

      if (jsonContent?.schema) {
        const bodySchema = jsonContent.schema;
        for (const [key, prop] of Object.entries(bodySchema.properties ?? {})) {
          const zodType = this.jsonSchemaToZod(prop);
          const isRequired =
            (requestBody.required && bodySchema.required?.includes(key)) ?? false;
          shape[key] = isRequired ? zodType : zodType.optional();
        }
      }
    }

    return z.object(shape);
  }
}

// Singleton con el documento OpenAPI cargado
export function createSchemaConverter(document: OpenApiDocumentDTO): SchemaConverter {
  const converter = new SchemaConverter();
  converter.setSchemas(document.components?.schemas ?? {});
  return converter;
}
