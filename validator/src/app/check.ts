import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { validateDocument } from "../core/validator.js";
import { validateGeneratedText } from "../core/output-validator.js";
import { createParserAdapter, type ParserKind } from "../cli/parser-options.js";
import { buildValidationReport, type ValidationReport } from "../report/report.js";
import type { ValidationResult } from "../types/validation.js";

export interface CheckOptions {
  file: string;
  parser: ParserKind;
  generatedTextFile?: string;
  reportOutFile?: string;
}

export interface CheckOutcome {
  file: string;
  parser: ParserKind;
  result: ValidationResult;
  report: ValidationReport;
  reportOutFile?: string;
}

export function runCheck(options: CheckOptions): CheckOutcome {
  const file = resolve(options.file);
  const sourceNml = readFileSync(file, "utf-8");
  const generatedText = options.generatedTextFile ? readFileSync(resolve(options.generatedTextFile), "utf-8") : undefined;

  const adapter = createParserAdapter(options.parser);
  const doc = adapter.parse(sourceNml, file);

  const base = validateDocument(doc);
  const textIssues = generatedText ? validateGeneratedText(doc, generatedText) : [];

  const result: ValidationResult = {
    passed: !(base.issues.concat(textIssues)).some((x) => x.severity === "error"),
    issues: base.issues.concat(textIssues),
  };

  const report = buildValidationReport(sourceNml, options.parser, result, generatedText);

  if (options.reportOutFile) {
    const reportOut = resolve(options.reportOutFile);
    mkdirSync(dirname(reportOut), { recursive: true });
    writeFileSync(reportOut, JSON.stringify(report, null, 2), "utf8");
  }

  return {
    file,
    parser: options.parser,
    result,
    report,
    reportOutFile: options.reportOutFile ? resolve(options.reportOutFile) : undefined,
  };
}
