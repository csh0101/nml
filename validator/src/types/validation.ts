export type Severity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  severity: Severity;
  message: string;
  path: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
}
