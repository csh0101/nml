import type { NmlDocument, AstNode } from "../types/ast.js";
import type { ValidationIssue, ValidationResult } from "../types/validation.js";
import { childrenOf, firstChild, walk } from "./node-utils.js";

const POV_ENUM = new Set(["第一人称", "第三人称限定"]);
const SCENE_PACE_ENUM = new Set(["慢", "中", "快", "慢转中", "中转快"]);
const ENDING_TYPE_ENUM = new Set(["转折", "悬念", "钩子", "回落"]);

function issue(code: string, message: string, path: string, severity: "error" | "warning" = "error"): ValidationIssue {
  return { code, message, path, severity };
}

function requireAttribute(node: AstNode, attr: string, path: string, issues: ValidationIssue[], code: string): void {
  if (!node.attributes[attr]) {
    issues.push(issue(code, `Missing required attribute '${attr}' on <${node.tag}>`, path));
  }
}

function isPercent(value: string): boolean {
  return /^\d{1,3}%$/.test(value);
}

function isRange(value: string): boolean {
  return /^\d+-\d+$/.test(value);
}

function sumRatio(attrs: Record<string, string>): number {
  const keys = ["描写", "对话", "动作", "心理"];
  let total = 0;
  for (const key of keys) {
    const raw = attrs[key];
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) return Number.NaN;
    total += n;
  }
  return total;
}

export function validateDocument(doc: NmlDocument): ValidationResult {
  const issues: ValidationIssue[] = [];
  const root = doc.root;

  if (root.tag !== "小说项目") {
    issues.push(issue("E1001", "Root element must be <小说项目>", `/${root.tag}`));
  }

  requireAttribute(root, "名称", `/${root.tag}`, issues, "E1002");
  requireAttribute(root, "版本", `/${root.tag}`, issues, "E1003");

  const metadata = childrenOf(root, "元数据");
  if (metadata.length !== 1) {
    issues.push(issue("E1101", "<小说项目> must contain exactly one <元数据>", `/${root.tag}`));
  }

  const body = firstChild(root, "正文");
  if (body) {
    const chapters = childrenOf(body, "章节");
    if (chapters.length < 1) {
      issues.push(issue("E1102", "<正文> must contain at least one <章节>", `/${root.tag}/正文`));
    }

    for (const chapter of chapters) {
      const chapterPath = `/${root.tag}/正文/章节`;
      requireAttribute(chapter, "序号", chapterPath, issues, "E1201");
      requireAttribute(chapter, "标题", chapterPath, issues, "E1202");

      const localSceneIds = new Set<string>();
      const scenes = childrenOf(chapter, "场景");
      if (scenes.length < 1) {
        issues.push(issue("E1203", "<章节> must contain at least one <场景>", chapterPath));
      }

      for (const scene of scenes) {
        const scenePath = `${chapterPath}/场景`;
        requireAttribute(scene, "id", scenePath, issues, "E1301");
        requireAttribute(scene, "地点引用", scenePath, issues, "E1302");

        const sceneId = scene.attributes["id"];
        if (sceneId) {
          if (localSceneIds.has(sceneId)) {
            issues.push(issue("E2104", `Duplicate scene id '${sceneId}' in same chapter`, scenePath));
          }
          localSceneIds.add(sceneId);
        }

        const pace = scene.attributes["节奏"];
        if (pace && !SCENE_PACE_ENUM.has(pace)) {
          issues.push(issue("E1206", `Invalid 场景.节奏 '${pace}'`, scenePath));
        }

        const tasks = childrenOf(scene, "任务");
        if (tasks.length !== 1) {
          issues.push(issue("E1303", "<场景> must contain exactly one <任务>", scenePath));
        }
        for (const task of tasks) {
          requireAttribute(task, "目标", `${scenePath}/任务`, issues, "E1304");
        }

        // Rule checks: 信息揭示
        const info = firstChild(scene, "信息揭示");
        if (info) {
          const must = childrenOf(info, "必须提及").map((x) => (x.text ?? "").trim()).filter(Boolean);
          const forbidden = childrenOf(info, "禁止提及").map((x) => (x.text ?? "").trim()).filter(Boolean);
          const overlap = must.filter((x) => forbidden.includes(x));
          if (overlap.length > 0) {
            issues.push(issue("E3102", `Info overlap in 必须提及/禁止提及: ${overlap.join(", ")}`, `${scenePath}/信息揭示`));
          }
        }

        // Rule checks: 配比
        const ratio = firstChild(scene, "配比");
        if (ratio) {
          const validateMode = ratio.attributes["校验"];
          if (validateMode === "和为100") {
            const total = sumRatio(ratio.attributes);
            if (!Number.isFinite(total)) {
              issues.push(issue("E3201", "配比 contains non-numeric values", `${scenePath}/配比`));
            } else if (total !== 100) {
              issues.push(issue("E3202", `配比 sum must be 100 when 校验=和为100, got ${total}`, `${scenePath}/配比`));
            }
          }
        }

        // Local uniqueness: 段.序号
        const plan = firstChild(scene, "段落计划");
        if (plan) {
          const seen = new Set<string>();
          for (const p of childrenOf(plan, "段")) {
            const idx = p.attributes["序号"];
            if (!idx) continue;
            if (seen.has(idx)) {
              issues.push(issue("E2105", `Duplicate 段.序号 '${idx}' in same 段落计划`, `${scenePath}/段落计划/段`));
            }
            seen.add(idx);
          }
        }
      }
    }
  }

  // IDs and global attribute/rule checks
  const roleIds = new Set<string>();
  const locationIds = new Set<string>();
  const styleIds = new Set<string>();

  walk(root, (node, path) => {
    if (node.tag === "写作准则") {
      const pov = node.attributes["视角"];
      if (pov && !POV_ENUM.has(pov)) {
        issues.push(issue("E1204", `Invalid 写作准则.视角 '${pov}'`, path));
      }
    }

    if (node.tag === "章节蓝图") {
      const tolerance = node.attributes["容差"];
      if (tolerance && !isPercent(tolerance)) {
        issues.push(issue("E1205", `Invalid 章节蓝图.容差 '${tolerance}', expected percent like 8%`, path));
      }
    }

    if (node.tag === "句法") {
      const avg = node.attributes["句均字数"];
      if (avg && !isRange(avg)) {
        issues.push(issue("E1207", `Invalid 句法.句均字数 '${avg}', expected range like 10-16`, path));
      }

      const longRatio = node.attributes["长句占比上限"];
      if (longRatio && !isPercent(longRatio)) {
        issues.push(issue("E1208", `Invalid 句法.长句占比上限 '${longRatio}', expected percent`, path));
      }
    }

    if (node.tag === "场景收束") {
      const t = node.attributes["类型"];
      if (t && !ENDING_TYPE_ENUM.has(t)) {
        issues.push(issue("E1209", `Invalid 场景收束.类型 '${t}'`, path));
      }
    }

    if (node.tag === "角色") {
      const id = node.attributes["id"];
      if (!id) {
        issues.push(issue("E1401", "<角色> requires id", path));
      } else if (roleIds.has(id)) {
        issues.push(issue("E2101", `Duplicate role id '${id}'`, path));
      } else {
        roleIds.add(id);
      }
    }

    if (node.tag === "地点") {
      const id = node.attributes["id"];
      if (!id) {
        issues.push(issue("E1402", "<地点> requires id", path));
      } else if (locationIds.has(id)) {
        issues.push(issue("E2102", `Duplicate location id '${id}'`, path));
      } else {
        locationIds.add(id);
      }
    }

    if (node.tag === "风格模板") {
      const id = node.attributes["id"];
      if (!id) {
        issues.push(issue("E1403", "<风格模板> requires id", path));
      } else if (styleIds.has(id)) {
        issues.push(issue("E2103", `Duplicate style template id '${id}'`, path));
      } else {
        styleIds.add(id);
      }
    }
  });

  // References
  walk(root, (node, path) => {
    if (node.tag === "章节") {
      const styleRef = node.attributes["风格模板引用"];
      if (styleRef && !styleIds.has(styleRef)) {
        issues.push(issue("E2203", `Missing style template ref '${styleRef}'`, path));
      }
    }

    if (node.tag === "场景") {
      const locRef = node.attributes["地点引用"];
      if (locRef && !locationIds.has(locRef)) {
        issues.push(issue("E2202", `Missing location ref '${locRef}'`, path));
      }

      const roleRef = node.attributes["视角角色"];
      if (roleRef && !roleIds.has(roleRef)) {
        issues.push(issue("E2201", `Missing role ref '${roleRef}'`, path, "warning"));
      }
    }
  });

  const passed = !issues.some((x) => x.severity === "error");
  return { passed, issues };
}
