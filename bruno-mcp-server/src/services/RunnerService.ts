import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import type { IRequestRunner } from "./interfaces.js";
import type { RunOptionsDTO, RunResultDTO, RequestRunResultDTO } from "../dto/runner/RunnerDTO.js";
import type { Config } from "../config/config.js";

const execAsync = promisify(exec);

/**
 * RunnerService — Integrates with @usebruno/cli (bru run).
 * Single Responsibility: execute Bruno collections via CLI and parse results.
 */
export class RunnerService implements IRequestRunner {
  constructor(private readonly config: Config) {}

  private get bruBin(): string {
    return this.config.cliPath || "bru";
  }

  private buildArgs(options: RunOptionsDTO): string[] {
    const args: string[] = [];
    if (options.env_name) args.push("--env", options.env_name);
    if (options.env_overrides) {
      for (const [k, v] of Object.entries(options.env_overrides)) {
        args.push("--env-var", `${k}=${v}`);
      }
    }
    if (options.bail ?? this.config.bailOnFailure) args.push("--bail");
    if (options.insecure ?? this.config.insecureSsl) args.push("--insecure");
    const timeout = options.timeout_ms ?? this.config.defaultTimeoutMs;
    if (timeout) args.push("--timeout", String(timeout));
    const delay = options.delay_ms ?? this.config.defaultDelayMs;
    if (delay) args.push("--delay", String(delay));
    if (options.cacert) args.push("--cacert", options.cacert);

    // Reporter flags
    const runId = randomUUID();
    const reportsDir = this.config.reportsDir;
    const format = options.format ?? this.config.defaultReportFormat;
    const jsonOut = options.reporter_json ?? path.join(reportsDir, `${runId}.json`);
    args.push("--reporter-json", jsonOut);
    if (format === "junit" || options.reporter_junit) {
      args.push("--reporter-junit", options.reporter_junit ?? path.join(reportsDir, `${runId}.xml`));
    }
    if (format === "html" || options.reporter_html) {
      args.push("--reporter-html", options.reporter_html ?? path.join(reportsDir, `${runId}.html`));
    }

    return args;
  }

  async runCollection(collectionPath: string, options: RunOptionsDTO = {}): Promise<RunResultDTO> {
    return this.executeRun(collectionPath, options);
  }

  async runFolder(folderPath: string, options: RunOptionsDTO = {}): Promise<RunResultDTO> {
    return this.executeRun(folderPath, options);
  }

  async runRequest(
    requestPath: string,
    envName: string,
    envOverrides?: Record<string, string>
  ): Promise<RequestRunResultDTO> {
    const result = await this.executeRun(requestPath, {
      env_name: envName,
      env_overrides: envOverrides,
    });
    return result.requests[0] ?? this.emptyRequestResult(requestPath);
  }

  private async executeRun(targetPath: string, options: RunOptionsDTO): Promise<RunResultDTO> {
    await fs.mkdir(this.config.reportsDir, { recursive: true });

    const runId = randomUUID();
    const jsonReportPath = path.join(this.config.reportsDir, `${runId}.json`);
    const args = this.buildArgs({ ...options, reporter_json: jsonReportPath });
    const cmd = `${this.bruBin} run "${targetPath}" ${args.join(" ")}`;

    const startedAt = new Date().toISOString();
    let stdout = "";
    let stderr = "";

    try {
      const result = await execAsync(cmd, { cwd: path.dirname(targetPath) });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (err) {
      // bru exits non-zero on test failures — still parse results
      const execErr = err as { stdout?: string; stderr?: string };
      stdout = execErr.stdout ?? "";
      stderr = execErr.stderr ?? "";
    }

    const finishedAt = new Date().toISOString();
    return this.parseResults(runId, targetPath, options.env_name ?? "", startedAt, finishedAt, jsonReportPath, stdout);
  }

  private async parseResults(
    runId: string,
    collectionPath: string,
    envName: string,
    startedAt: string,
    finishedAt: string,
    jsonReportPath: string,
    _stdout: string
  ): Promise<RunResultDTO> {
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

    // Try to read JSON report
    try {
      const reportRaw = await fs.readFile(jsonReportPath, "utf-8");
      const report = JSON.parse(reportRaw) as Record<string, unknown>;
      return this.mapBruReportToDTO(runId, collectionPath, envName, startedAt, finishedAt, durationMs, report);
    } catch {
      // Return empty result if report not available
      return {
        run_id: runId,
        collection_path: collectionPath,
        env_name: envName,
        started_at: startedAt,
        finished_at: finishedAt,
        duration_ms: durationMs,
        status: "failed",
        summary: {
          total_requests: 0, passed_requests: 0, failed_requests: 0,
          total_assertions: 0, passed_assertions: 0, failed_assertions: 0,
          total_tests: 0, passed_tests: 0, failed_tests: 0,
        },
        requests: [],
      };
    }
  }

  private mapBruReportToDTO(
    runId: string,
    collectionPath: string,
    envName: string,
    startedAt: string,
    finishedAt: string,
    durationMs: number,
    report: Record<string, unknown>
  ): RunResultDTO {
    const results = (report["results"] as Record<string, unknown>[]) ?? [];

    const requests: RequestRunResultDTO[] = results.map((r) => ({
      name: r["suiteName"] as string ?? "",
      path: r["suiteName"] as string ?? "",
      method: "",
      url: "",
      status_code: (r["status"] as number) ?? 0,
      response_time_ms: (r["duration"] as number) ?? 0,
      assertions: ((r["assertionResults"] as Record<string, unknown>[]) ?? []).map((a) => ({
        expr: a["name"] as string ?? "",
        operator: "",
        passed: a["status"] === "pass",
        error: a["status"] !== "pass" ? (a["error"] as string) : undefined,
      })),
      tests: ((r["testResults"] as Record<string, unknown>[]) ?? []).map((t) => ({
        name: t["description"] as string ?? "",
        passed: t["status"] === "pass",
        error: t["status"] !== "pass" ? (t["error"] as string) : undefined,
      })),
    }));

    const passedReqs = requests.filter((r) => r.status_code >= 200 && r.status_code < 300).length;
    const totalAssertions = requests.reduce((s, r) => s + r.assertions.length, 0);
    const passedAssertions = requests.reduce((s, r) => s + r.assertions.filter((a) => a.passed).length, 0);
    const totalTests = requests.reduce((s, r) => s + r.tests.length, 0);
    const passedTests = requests.reduce((s, r) => s + r.tests.filter((t) => t.passed).length, 0);

    const allPassed = passedReqs === requests.length && passedAssertions === totalAssertions && passedTests === totalTests;
    const nonePassed = passedReqs === 0 && requests.length > 0;

    return {
      run_id: runId,
      collection_path: collectionPath,
      env_name: envName,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
      status: allPassed ? "passed" : nonePassed ? "failed" : "partial",
      summary: {
        total_requests: requests.length,
        passed_requests: passedReqs,
        failed_requests: requests.length - passedReqs,
        total_assertions: totalAssertions,
        passed_assertions: passedAssertions,
        failed_assertions: totalAssertions - passedAssertions,
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
      },
      requests,
    };
  }

  private emptyRequestResult(requestPath: string): RequestRunResultDTO {
    return {
      name: path.basename(requestPath, ".bru"),
      path: requestPath,
      method: "",
      url: "",
      status_code: 0,
      response_time_ms: 0,
      assertions: [],
      tests: [],
      error: "No result returned",
    };
  }

  async listReports(collectionPath: string): Promise<string[]> {
    const prefix = path.basename(collectionPath);
    try {
      const files = await fs.readdir(this.config.reportsDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.join(this.config.reportsDir, f));
    } catch {
      return [];
    }
  }
}
