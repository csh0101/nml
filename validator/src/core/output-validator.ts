import type { NmlDocument, AstNode } from "../types/ast.js";
import type { ValidationIssue } from "../types/validation.js";
import { childrenOf, firstChild, walk } from "./node-utils.js";

function issue(code: string, message: string, path: string, severity: "error" | "warning" = "error"): ValidationIssue {
  return { code, message, path, severity };
}

interface SceneInfo {
  path: string;
  required: string[];
  forbidden: string[];
  ending?: string;
}

function collectSceneInfo(doc: NmlDocument): SceneInfo[] {
  const out: SceneInfo[] = [];

  walk(doc.root, (node, path) => {
    if (node.tag !== "场景") return;

    const info = firstChild(node, "信息揭示");
    const required = info
      ? childrenOf(info, "必须提及").map((x) => (x.text ?? "").trim()).filter(Boolean)
      : [];
    const forbidden = info
      ? childrenOf(info, "禁止提及").map((x) => (x.text ?? "").trim()).filter(Boolean)
      : [];

    const endingNode = firstChild(node, "场景收束");
    const ending = endingNode?.attributes["落点"]?.trim();

    out.push({ path, required, forbidden, ending });
  });

  return out;
}

export function validateGeneratedText(doc: NmlDocument, generatedText: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scenes = collectSceneInfo(doc);

  for (const scene of scenes) {
    for (const req of scene.required) {
      if (!generatedText.includes(req)) {
        issues.push(issue("E3004", `Missing required info in generated text: ${req}`, scene.path));
      }
    }

    for (const fbd of scene.forbidden) {
      if (generatedText.includes(fbd)) {
        issues.push(issue("E3007", `Forbidden info found in generated text: ${fbd}`, scene.path));
      }
    }

    if (scene.ending && !generatedText.includes(scene.ending)) {
      issues.push(issue("E3009", `Ending target not hit in generated text: ${scene.ending}`, scene.path));
    }
  }

  return issues;
}
