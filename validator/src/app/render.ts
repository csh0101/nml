import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { renderPrompt, type RenderModel } from "../renderer/prompt-renderer.js";
import type { PromptIR } from "../types/prompt-ir.js";

export interface RenderOptions {
  irFile: string;
  model: RenderModel;
  outFile?: string;
}

export interface RenderOutcome {
  irFile: string;
  model: RenderModel;
  prompt: string;
  outFile?: string;
}

export function runRender(options: RenderOptions): RenderOutcome {
  const irFile = resolve(options.irFile);
  const raw = readFileSync(irFile, "utf-8");
  const ir = JSON.parse(raw) as PromptIR;
  const prompt = renderPrompt(ir, options.model);

  if (options.outFile) {
    const outPath = resolve(options.outFile);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, prompt, "utf-8");
    return { irFile, model: options.model, prompt, outFile: outPath };
  }

  return { irFile, model: options.model, prompt };
}
