import type { ValidationIssue } from "../types/validation.js";

export interface Metrics {
  word_count: number;
  avg_sentence_len: number;
  max_sentence_len: number;
  long_sentence_ratio: number;
  forbidden_word_hits: number;
  required_info_coverage: number;
  forbidden_info_violations: number;
  ending_hit: boolean;
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countChars(text: string): number {
  return text.replace(/\s+/g, "").length;
}

function extractTagTexts(content: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g");
  const out: string[] = [];
  for (const m of content.matchAll(re)) {
    out.push((m[1] ?? "").trim());
  }
  return out.filter(Boolean);
}

function extractSceneEnding(content: string): string | undefined {
  const m = content.match(/<场景收束[^>]*落点="([^"]+)"[^>]*\/?>(?:<\/场景收束>)?/);
  return m?.[1]?.trim();
}

export function computeMetrics(sourceNml: string, issues: ValidationIssue[], generatedText?: string): Metrics {
  const targetText = generatedText?.trim() ? generatedText : sourceNml;

  const sentences = splitSentences(targetText);
  const sentenceLengths = sentences.map(countChars);
  const wordCount = countChars(targetText);
  const maxLen = sentenceLengths.length ? Math.max(...sentenceLengths) : 0;
  const avgLen = sentenceLengths.length ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length : 0;
  const longCount = sentenceLengths.filter((x) => x > 24).length;
  const longRatio = sentenceLengths.length ? longCount / sentenceLengths.length : 0;

  const required = extractTagTexts(sourceNml, "必须提及");
  const requiredHit = required.filter((x) => targetText.includes(x)).length;
  const requiredCoverage = required.length > 0 ? requiredHit / required.length : 1;

  const forbiddenHits = issues.filter((x) => x.code === "E3007").length;
  const forbiddenViolations = forbiddenHits;

  const ending = extractSceneEnding(sourceNml);
  const endingHit = ending ? targetText.includes(ending) : true;

  return {
    word_count: wordCount,
    avg_sentence_len: Number(avgLen.toFixed(2)),
    max_sentence_len: maxLen,
    long_sentence_ratio: Number(longRatio.toFixed(4)),
    forbidden_word_hits: forbiddenHits,
    required_info_coverage: Number(requiredCoverage.toFixed(4)),
    forbidden_info_violations: forbiddenViolations,
    ending_hit: endingHit,
  };
}
