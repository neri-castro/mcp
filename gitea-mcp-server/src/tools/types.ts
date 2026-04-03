// src/tools/types.ts

import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (args: unknown) => Promise<string>;
}

export type ToolRegistry = Map<string, ToolDefinition>;

/** Serializa cualquier resultado a JSON legible */
export function toResult(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/** Wrap un handler con manejo de error uniforme */
export function safeResult(data: unknown): string {
  if (data === undefined || data === null) {
    return JSON.stringify({ success: true });
  }
  return toResult(data);
}
