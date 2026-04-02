import { createHash, randomUUID } from "node:crypto";
import type { ValidationIssue, ValidationResult } from "../types/validation.js";
import { computeMetrics, type Metrics } from "./metrics.js";

export interface ValidationReport {
  report_id: string;
  created_at: string;
  project_name: string;
  nml_version: string;
  scene_id: string;
  attempt_no: number;
  parser: "xml" | "tree-sitter";
  passed: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  metrics: Metrics;
  output_hash: string;
  generated_text_hash?: string;
}

function extractAttr(content: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, "m");
  return content.match(re)?.[1]?.trim();
}

function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

export function buildValidationReport(
  sourceNml: string,
  parser: "xml" | "tree-sitter",
  result: ValidationResult,
  generatedText?: string,
): ValidationReport {
  const projectName = extractAttr(sourceNml, "小说项目", "名称") ?? "unknown";
  const nmlVersion = extractAttr(sourceNml, "小说项目", "版本") ?? "unknown";
  const sceneId = extractAttr(sourceNml, "场景", "id") ?? "unknown";
  const now = new Date().toISOString();

  const errors = result.issues.filter((x) => x.severity === "error");
  const warnings = result.issues.filter((x) => x.severity === "warning");

  return {
    report_id: `rpt-${Date.now()}-${sceneId}-${randomUUID().slice(0, 8)}`,
    created_at: now,
    project_name: projectName,
    nml_version: nmlVersion,
    scene_id: sceneId,
    attempt_no: 1,
    parser,
    passed: result.passed,
    errors,
    warnings,
    metrics: computeMetrics(sourceNml, result.issues, generatedText),
    output_hash: sha256(sourceNml),
    generated_text_hash: generatedText ? sha256(generatedText) : undefined,
  };
}
