import { readdirSync, readFileSync } from "node:fs";
import { resolve, basename, extname, join } from "node:path";
import { validateDocument } from "../core/validator.js";
import { validateGeneratedText } from "../core/output-validator.js";
import { createParserAdapter, type ParserKind } from "../cli/parser-options.js";
import type { ValidationResult } from "../types/validation.js";

export interface RegressionExpected {
  passed: boolean;
  errorCodes?: string[];
  warningCodes?: string[];
  generatedTextFile?: string;
}

export interface RegressionCaseOutcome {
  file: string;
  expected: RegressionExpected;
  actual: ValidationResult;
  passMatch: boolean;
  errMatch: boolean;
  warnMatch: boolean;
}

export interface RegressionSummary {
  parser: ParserKind;
  baseDir: string;
  total: number;
  failed: number;
  cases: RegressionCaseOutcome[];
}

export interface RegressOptions {
  parser: ParserKind;
  baseDir?: string;
}

export function runRegression(options: RegressOptions): RegressionSummary {
  const base = resolve(options.baseDir ?? "src/samples/regression");
  const files = readdirSync(base).filter((f) => extname(f) === ".nml").sort();

  const adapter = createParserAdapter(options.parser);
  const cases: RegressionCaseOutcome[] = [];

  for (const file of files) {
    const full = join(base, file);
    const content = readFileSync(full, "utf-8");
    const expectPath = join(base, `${basename(file, ".nml")}.expect.json`);
    const expected = JSON.parse(readFileSync(expectPath, "utf-8")) as RegressionExpected;

    const doc = adapter.parse(content, full);
    const baseResult = validateDocument(doc);

    const generatedText = expected.generatedTextFile
      ? readFileSync(resolve(base, expected.generatedTextFile), "utf-8")
      : undefined;
    const textIssues = generatedText ? validateGeneratedText(doc, generatedText) : [];

    const actual: ValidationResult = {
      passed: !(baseResult.issues.concat(textIssues)).some((x) => x.severity === "error"),
      issues: baseResult.issues.concat(textIssues),
    };

    const actualErrors = actual.issues.filter((x) => x.severity === "error").map((x) => x.code).sort();
    const actualWarnings = actual.issues.filter((x) => x.severity === "warning").map((x) => x.code).sort();
    const expectedErrors = [...(expected.errorCodes ?? [])].sort();
    const expectedWarnings = [...(expected.warningCodes ?? [])].sort();

    const passMatch = actual.passed === expected.passed;
    const errMatch = JSON.stringify(actualErrors) === JSON.stringify(expectedErrors);
    const warnMatch = JSON.stringify(actualWarnings) === JSON.stringify(expectedWarnings);

    cases.push({
      file,
      expected,
      actual,
      passMatch,
      errMatch,
      warnMatch,
    });
  }

  const failed = cases.filter((x) => !(x.passMatch && x.errMatch && x.warnMatch)).length;

  return {
    parser: options.parser,
    baseDir: base,
    total: cases.length,
    failed,
    cases,
  };
}
