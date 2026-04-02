import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createParserAdapter, type ParserKind } from "../cli/parser-options.js";
import { walk } from "../core/node-utils.js";
import type { AstNode, NmlDocument } from "../types/ast.js";

export interface InspectOptions {
  file: string;
  parser: ParserKind;
  astJsonOutFile?: string;
}

export interface InspectSummary {
  file: string;
  parser: ParserKind;
  rootTag: string;
  nodeCount: number;
  maxDepth: number;
  uniqueTags: string[];
  tagHistogram: Record<string, number>;
  topLevelChildren: string[];
}

function computeMaxDepth(node: AstNode, depth = 1): number {
  if (node.children.length === 0) return depth;
  return Math.max(...node.children.map((child) => computeMaxDepth(child, depth + 1)));
}

function summarize(doc: NmlDocument, file: string, parser: ParserKind): InspectSummary {
  const histogram: Record<string, number> = {};
  let nodeCount = 0;
  walk(doc.root, (node) => {
    nodeCount += 1;
    histogram[node.tag] = (histogram[node.tag] ?? 0) + 1;
  });

  return {
    file,
    parser,
    rootTag: doc.root.tag,
    nodeCount,
    maxDepth: computeMaxDepth(doc.root),
    uniqueTags: Object.keys(histogram).sort(),
    tagHistogram: Object.fromEntries(Object.entries(histogram).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"))),
    topLevelChildren: doc.root.children.map((x) => x.tag),
  };
}

export function runInspect(options: InspectOptions): { summary: InspectSummary; doc: NmlDocument; astJsonOutFile?: string } {
  const file = resolve(options.file);
  const sourceNml = readFileSync(file, "utf-8");
  const adapter = createParserAdapter(options.parser);
  const doc = adapter.parse(sourceNml, file);
  const summary = summarize(doc, file, options.parser);

  if (options.astJsonOutFile) {
    const out = resolve(options.astJsonOutFile);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(doc, null, 2), "utf-8");
    return { summary, doc, astJsonOutFile: out };
  }

  return { summary, doc };
}

