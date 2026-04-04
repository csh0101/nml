import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createParserAdapter, type ParserKind } from "../cli/parser-options.js";
import { validateDocument } from "../core/validator.js";
import { compilePromptIR } from "../compiler/prompt-ir.js";
import type { ValidationResult } from "../types/validation.js";
import type { PromptIR } from "../types/prompt-ir.js";

export interface CompileOptions {
  file: string;
  parser: ParserKind;
  chapterOrder?: number;
  outFile?: string;
}

export interface CompileOutcome {
  file: string;
  parser: ParserKind;
  validation: ValidationResult;
  ir?: PromptIR;
  outFile?: string;
}

export function runCompile(options: CompileOptions): CompileOutcome {
  const file = resolve(options.file);
  const sourceNml = readFileSync(file, "utf-8");
  const adapter = createParserAdapter(options.parser);
  const doc = adapter.parse(sourceNml, file);

  const validation = validateDocument(doc);
  const hasError = validation.issues.some((x) => x.severity === "error");
  if (hasError) {
    return {
      file,
      parser: options.parser,
      validation,
    };
  }

  const ir = compilePromptIR(doc, { chapterOrder: options.chapterOrder });

  if (options.outFile) {
    const outPath = resolve(options.outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(ir, null, 2), "utf-8");
    return {
      file,
      parser: options.parser,
      validation,
      ir,
      outFile: outPath,
    };
  }

  return {
    file,
    parser: options.parser,
    validation,
    ir,
  };
}

