export type ReportFormat = "json" | "junit" | "html";

export interface RunOptionsDTO {
  env_name?: string;
  env_overrides?: Record<string, string>;
  output_path?: string;
  format?: ReportFormat;
  bail?: boolean;
  insecure?: boolean;
  timeout_ms?: number;
  delay_ms?: number;
  reporter_json?: string;
  reporter_junit?: string;
  reporter_html?: string;
  cacert?: string;
}

export interface RequestRunResultDTO {
  name: string;
  path: string;
  method: string;
  url: string;
  status_code: number;
  response_time_ms: number;
  assertions: { expr: string; operator: string; passed: boolean; error?: string }[];
  tests: { name: string; passed: boolean; error?: string }[];
  error?: string;
}

export interface RunResultDTO {
  run_id: string;
  collection_path: string;
  env_name: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  status: "passed" | "failed" | "partial";
  summary: {
    total_requests: number;
    passed_requests: number;
    failed_requests: number;
    total_assertions: number;
    passed_assertions: number;
    failed_assertions: number;
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
  };
  requests: RequestRunResultDTO[];
}
