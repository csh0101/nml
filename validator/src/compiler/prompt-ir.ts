import type { AstNode, NmlDocument } from "../types/ast.js";
import type { PromptIR, PromptIrScene, PromptIrSegment } from "../types/prompt-ir.js";
import { childrenOf, firstChild } from "../core/node-utils.js";

export interface CompilePromptIrOptions {
  chapterOrder?: number;
}

export class PromptIrCompileError extends Error {}

const SCENE_PACE_CANONICAL = new Set(["慢", "中", "快", "慢转中", "中转快"]);
const SEGMENT_FUNCTION_CANONICAL = new Set(["铺垫", "推进", "转折", "爆发", "回落", "钩子"]);
const NORMALIZE_MAP: Record<string, string> = {
  慢速: "慢",
  中速: "中",
  快速: "快",
  紧张: "紧绷",
  肅殺: "肃杀",
  肃殺: "肃杀",
  試探: "试探",
  對抗: "对抗",
  敵對: "敌对",
};

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) return undefined;
  return Number(value);
}

function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[，,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeToken(raw: string): string {
  const cleaned = raw.trim();
  return NORMALIZE_MAP[cleaned] ?? cleaned;
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function textList(parent: AstNode | undefined, tag: string): string[] {
  if (!parent) return [];
  return childrenOf(parent, tag)
    .map((x) => (x.text ?? "").trim())
    .filter(Boolean);
}

function sceneRatio(scene: AstNode): PromptIrScene["ratio"] {
  const ratio = firstChild(scene, "配比");
  if (!ratio) return undefined;
  return {
    description: toInt(ratio.attributes["描写"]),
    dialogue: toInt(ratio.attributes["对话"]),
    action: toInt(ratio.attributes["动作"]),
    psychology: toInt(ratio.attributes["心理"]),
  };
}

function compileSegment(segmentNode: AstNode): PromptIrSegment {
  return {
    index: toInt(segmentNode.attributes["序号"]),
    targetWords: toInt(segmentNode.attributes["字数目标"]),
    func: segmentNode.attributes["功能"],
    focus: segmentNode.attributes["焦点"],
    pace: segmentNode.attributes["节奏"],
    povRole: segmentNode.attributes["视角"],
    dialogueRatio: toInt(segmentNode.attributes["对话占比"]),
    actionRatio: toInt(segmentNode.attributes["动作占比"]),
    infoPoints: childrenOf(segmentNode, "信息点").map((point) => ({
      type: point.attributes["类型"],
      weight: toInt(point.attributes["权重"]),
      text: (point.text ?? "").trim(),
    })),
    states: childrenOf(segmentNode, "状态").map((state) => ({
      role: state.attributes["角色"] ?? "",
      phase: state.attributes["阶段"] ?? "",
      stamina: state.attributes["体力"],
      mood: state.attributes["情绪"],
    })),
    relationStates: childrenOf(segmentNode, "关系状态")
      .map((rel) => {
        const strength = toInt(rel.attributes["强度"]);
        if (strength == null) return undefined;
        return {
          role: rel.attributes["角色"] ?? "",
          target: rel.attributes["目标"] ?? "",
          phase: rel.attributes["阶段"] ?? "",
          strength,
          type: rel.attributes["类型"],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null),
  };
}

function compileScene(sceneNode: AstNode, locationMap: Map<string, string>): PromptIrScene {
  const info = firstChild(sceneNode, "信息揭示");
  const plan = firstChild(sceneNode, "段落计划");
  const ending = firstChild(sceneNode, "场景收束");
  const task = firstChild(sceneNode, "任务");
  const locationRef = sceneNode.attributes["地点引用"] ?? "";

  return {
    id: sceneNode.attributes["id"] ?? "",
    locationRef,
    locationName: locationMap.get(locationRef),
    povRole: sceneNode.attributes["视角角色"],
    pace: sceneNode.attributes["节奏"],
    atmosphere: splitCsv(sceneNode.attributes["氛围"]),
    targetWords: toInt(sceneNode.attributes["字数目标"]),
    task: task?.attributes["目标"] ?? "",
    mustMention: textList(info, "必须提及"),
    mustNotMention: textList(info, "禁止提及"),
    ratio: sceneRatio(sceneNode),
    segments: plan ? childrenOf(plan, "段").map(compileSegment) : [],
    ending: ending
      ? {
          type: ending.attributes["类型"],
          beat: ending.attributes["落点"],
        }
      : undefined,
  };
}

function pickChapter(chapters: AstNode[], chapterOrder?: number): AstNode {
  if (chapters.length === 0) throw new PromptIrCompileError("No <章节> found under <正文>");
  if (chapterOrder == null) return chapters[0]!;

  const found = chapters.find((x) => toInt(x.attributes["序号"]) === chapterOrder);
  if (!found) throw new PromptIrCompileError(`Chapter not found by 序号=${chapterOrder}`);
  return found;
}

export function compilePromptIR(doc: NmlDocument, options: CompilePromptIrOptions = {}): PromptIR {
  const root = doc.root;
  if (root.tag !== "小说项目") throw new PromptIrCompileError("Root element must be <小说项目>");

  const metadata = firstChild(root, "元数据");
  const rule = metadata ? firstChild(metadata, "写作准则") : undefined;

  const setting = firstChild(root, "设定集");
  const locationMap = new Map<string, string>();
  for (const loc of setting ? childrenOf(setting, "地点") : []) {
    const id = loc.attributes["id"];
    const name = loc.attributes["名称"];
    if (id && name) locationMap.set(id, name);
  }

  const body = firstChild(root, "正文");
  if (!body) throw new PromptIrCompileError("Missing <正文>");
  const chapter = pickChapter(childrenOf(body, "章节"), options.chapterOrder);
  const chapterBlueprint = firstChild(chapter, "章节蓝图");

  const sceneNodes = childrenOf(chapter, "场景");
  const scenes = sceneNodes.map((sceneNode) => compileScene(sceneNode, locationMap));
  const summedWords = scenes.reduce((sum, s) => sum + (s.targetWords ?? 0), 0);

  const unknownTokens: PromptIR["normalized"]["unknownTokens"] = [];
  const normalizedScenes: PromptIR["normalized"]["scenes"] = scenes.map((scene) => {
    const normalizedPace = scene.pace ? normalizeToken(scene.pace) : undefined;
    if (normalizedPace && !SCENE_PACE_CANONICAL.has(normalizedPace)) {
      unknownTokens.push({ scope: `scene:${scene.id}`, field: "pace", raw: scene.pace! });
    }

    const paceStages =
      normalizedPace === "慢转中"
        ? ["慢", "中"]
        : normalizedPace === "中转快"
          ? ["中", "快"]
          : normalizedPace
            ? [normalizedPace]
            : [];

    const atmosphere = uniquePreserveOrder(scene.atmosphere.map(normalizeToken));
    const mustMention = uniquePreserveOrder(scene.mustMention.map(normalizeToken));
    const mustNotMention = uniquePreserveOrder(scene.mustNotMention.map(normalizeToken));
    const overlapMentions = mustMention.filter((x) => mustNotMention.includes(x));

    const segmentFunctions = scene.segments
      .map((seg) => (seg.func ? normalizeToken(seg.func) : ""))
      .filter(Boolean);
    for (const fn of segmentFunctions) {
      if (!SEGMENT_FUNCTION_CANONICAL.has(fn)) {
        unknownTokens.push({ scope: `scene:${scene.id}`, field: "segment.function", raw: fn });
      }
    }

    return {
      sceneId: scene.id,
      pace: normalizedPace,
      paceStages,
      atmosphere,
      mustMention,
      mustNotMention,
      overlapMentions,
      segmentFunctions,
    };
  });

  const hardConstraints: PromptIR["resolvedConstraints"]["hardConstraints"] = [];
  const softConstraints: PromptIR["resolvedConstraints"]["softConstraints"] = [];
  const conflictResolutions: PromptIR["resolvedConstraints"]["conflictResolutions"] = [];
  for (const scene of scenes) {
    if (scene.task) {
      hardConstraints.push({ scope: `scene:${scene.id}`, code: "TASK_REQUIRED", detail: scene.task });
    }
    for (const x of scene.mustNotMention) {
      hardConstraints.push({ scope: `scene:${scene.id}`, code: "FORBIDDEN_MENTION", detail: x });
    }
    for (const x of scene.mustMention) {
      softConstraints.push({ scope: `scene:${scene.id}`, code: "REQUIRED_MENTION", detail: x });
    }
    if (scene.ending?.beat) {
      hardConstraints.push({ scope: `scene:${scene.id}`, code: "ENDING_BEAT_REQUIRED", detail: scene.ending.beat });
    }
  }

  for (const n of normalizedScenes) {
    for (const overlap of n.overlapMentions) {
      conflictResolutions.push({
        scope: `scene:${n.sceneId}`,
        code: "CONFLICT_REQUIRED_FORBIDDEN",
        detail: `禁止提及优先: ${overlap}`,
      });
    }
  }

  const generationPlan: PromptIR["generationPlan"] = [];
  for (const scene of scenes) {
    generationPlan.push({
      sceneId: scene.id,
      stepNo: 1,
      label: "SceneGoal",
      targetWords: scene.targetWords,
      guidance: scene.task || "完成场景目标",
    });
    if (scene.segments.length > 0) {
      for (const seg of scene.segments) {
        generationPlan.push({
          sceneId: scene.id,
          stepNo: generationPlan.filter((x) => x.sceneId === scene.id).length + 1,
          label: `Segment-${seg.index ?? "?"}-${seg.func ?? "未定义"}`,
          targetWords: seg.targetWords,
          guidance: [
            seg.focus ? `焦点:${seg.focus}` : undefined,
            seg.pace ? `节奏:${normalizeToken(seg.pace)}` : undefined,
            seg.infoPoints.length > 0
              ? `信息点:${seg.infoPoints.map((x) => normalizeToken(x.text)).filter(Boolean).join(" | ")}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" ; "),
        });
      }
    }
    if (scene.ending?.beat) {
      generationPlan.push({
        sceneId: scene.id,
        stepNo: generationPlan.filter((x) => x.sceneId === scene.id).length + 1,
        label: "SceneEnding",
        guidance: `命中收束落点: ${scene.ending.beat}`,
      });
    }
  }

  const acceptancePlan: PromptIR["acceptancePlan"] = [];
  for (const scene of scenes) {
    acceptancePlan.push({ scope: `scene:${scene.id}`, check: "TASK_PRESENT", required: true });
    acceptancePlan.push({ scope: `scene:${scene.id}`, check: "FORBIDDEN_MENTION_NOT_PRESENT", required: true });
    acceptancePlan.push({ scope: `scene:${scene.id}`, check: "REQUIRED_MENTION_COVERAGE", required: true });
    acceptancePlan.push({ scope: `scene:${scene.id}`, check: "ENDING_BEAT_HIT", required: Boolean(scene.ending?.beat) });
    if (scene.segments.length > 0) {
      acceptancePlan.push({ scope: `scene:${scene.id}`, check: "SEGMENT_INFO_POINT_COVERAGE", required: true });
    }
  }

  return {
    irVersion: "1.1",
    project: {
      name: root.attributes["名称"] ?? "unknown",
      nmlVersion: root.attributes["版本"] ?? "unknown",
      style: rule?.attributes["文风"],
      pov: rule?.attributes["视角"],
      detailLevel: toInt(rule?.attributes["细节度"]),
    },
    chapter: {
      index: toInt(chapter.attributes["序号"]) ?? 1,
      title: chapter.attributes["标题"] ?? "untitled",
      targetWords: toInt(chapterBlueprint?.attributes["字数目标"]) ?? (summedWords > 0 ? summedWords : undefined),
      goal: chapterBlueprint?.attributes["章节目标"],
      hook: chapterBlueprint?.attributes["章节钩子"],
      styleTemplateRef: chapter.attributes["风格模板引用"],
    },
    scenes,
    normalized: {
      scenes: normalizedScenes,
      unknownTokens,
    },
    resolvedConstraints: {
      priorityOrder: ["禁止提及", "必须提及", "场景收束", "段落计划"],
      hardConstraints,
      softConstraints,
      conflictResolutions,
    },
    generationPlan,
    acceptancePlan,
  };
}
