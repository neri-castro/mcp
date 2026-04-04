/**
 * BruParser — Centralized wrapper for @usebruno/lang
 * Single Responsibility: parse raw .bru text into structured objects.
 */
export class BruParser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lang: any;

  async init(): Promise<void> {
    // Dynamic import because @usebruno/lang is CJS
    try {
      this.lang = await import("@usebruno/lang");
    } catch {
      // Fallback: manual parser for environments without the package
      this.lang = null;
    }
  }

  parse(raw: string): Record<string, unknown> {
    if (this.lang) {
      try {
        return this.lang.bruToJson(raw) as Record<string, unknown>;
      } catch (err) {
        throw new Error(`PARSE_ERROR: ${(err as Error).message}`);
      }
    }
    // Minimal fallback parser
    return this.fallbackParse(raw);
  }

  private fallbackParse(raw: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const metaMatch = raw.match(/meta\s*\{([^}]*)\}/s);
    if (metaMatch) {
      const meta: Record<string, string> = {};
      for (const line of metaMatch[1].split("\n")) {
        const m = line.match(/^\s*(\w+)\s*:\s*(.+)$/);
        if (m) meta[m[1].trim()] = m[2].trim();
      }
      result["meta"] = meta;
    }
    return result;
  }
}
