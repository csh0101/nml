import type { PromptIR } from "../types/prompt-ir.js";

export type RenderModel = "claude" | "openai";

function sceneBlock(scene: PromptIR["scenes"][number]): string {
  const must = scene.mustMention.length > 0 ? scene.mustMention.join("、") : "无";
  const forbid = scene.mustNotMention.length > 0 ? scene.mustNotMention.join("、") : "无";
  const segLines =
    scene.segments.length > 0
      ? scene.segments
          .map((s) => {
            const info = s.infoPoints.map((x) => x.text).filter(Boolean).join(" | ");
            return `- 段${s.index ?? "?"}: ${s.func ?? "未定义"} / 焦点=${s.focus ?? "未定义"} / 节奏=${s.pace ?? "未定义"} / 字数=${s.targetWords ?? "未定义"} / 信息点=${info || "无"}`;
          })
          .join("\n")
      : "- 无段落计划";

  return [
    `场景 ${scene.id}`,
    `- 地点: ${scene.locationName ?? scene.locationRef}`,
    `- 视角: ${scene.povRole ?? "未指定"}`,
    `- 节奏: ${scene.pace ?? "未指定"}`,
    `- 字数目标: ${scene.targetWords ?? "未指定"}`,
    `- 任务: ${scene.task || "未指定"}`,
    `- 必须提及: ${must}`,
    `- 禁止提及: ${forbid}`,
    segLines,
    `- 收束: ${scene.ending?.type ?? "未指定"} / ${scene.ending?.beat ?? "未指定"}`,
  ].join("\n");
}

function renderClaude(ir: PromptIR): string {
  const scenes = ir.scenes.map(sceneBlock).join("\n\n");
  return [
    "你是长篇网文写作代理，任务是根据给定的结构化约束生成章节正文。",
    "要求：简练、推进优先、避免拖沓；严格遵守禁止项与收束落点。",
    "",
    "【项目上下文】",
    `- 书名: ${ir.project.name}`,
    `- 版本: ${ir.project.nmlVersion}`,
    `- 文风: ${ir.project.style ?? "未指定"}`,
    `- 视角: ${ir.project.pov ?? "未指定"}`,
    "",
    "【章节目标】",
    `- 章节: 第${ir.chapter.index}章《${ir.chapter.title}》`,
    `- 目标字数: ${ir.chapter.targetWords ?? "未指定"}`,
    `- 章节目标: ${ir.chapter.goal ?? "未指定"}`,
    `- 章节钩子: ${ir.chapter.hook ?? "未指定"}`,
    "",
    "【场景计划】",
    scenes,
    "",
    "【验收要求】",
    "1. 不得出现禁止提及项。",
    "2. 必须覆盖每个场景的必须提及项。",
    "3. 结尾必须命中场景收束落点。",
    "4. 输出仅正文，不要解释。",
  ].join("\n");
}

function renderOpenAI(ir: PromptIR): string {
  const scenes = ir.scenes
    .map((scene) => {
      const segs = scene.segments.map((s) => ({
        index: s.index,
        targetWords: s.targetWords,
        function: s.func,
        focus: s.focus,
        pace: s.pace,
        infoPoints: s.infoPoints,
      }));
      return {
        id: scene.id,
        location: scene.locationName ?? scene.locationRef,
        pov: scene.povRole,
        pace: scene.pace,
        targetWords: scene.targetWords,
        task: scene.task,
        mustMention: scene.mustMention,
        mustNotMention: scene.mustNotMention,
        segments: segs,
        ending: scene.ending,
      };
    })
    .map((x) => JSON.stringify(x, null, 2))
    .join("\n\n");

  return [
    "Role: Chinese web-novel chapter writer.",
    "Output: chapter prose only (no analysis).",
    "Constraints: concise style, progression-first, obey mustMention/mustNotMention, hit ending beat.",
    "",
    `Project=${ir.project.name} Version=${ir.project.nmlVersion} Style=${ir.project.style ?? ""} POV=${ir.project.pov ?? ""}`,
    `Chapter=${ir.chapter.index} Title=${ir.chapter.title} TargetWords=${ir.chapter.targetWords ?? ""}`,
    `ChapterGoal=${ir.chapter.goal ?? ""}`,
    `ChapterHook=${ir.chapter.hook ?? ""}`,
    "",
    "SceneSpecs(JSON):",
    scenes,
  ].join("\n");
}

export function renderPrompt(ir: PromptIR, model: RenderModel): string {
  if (model === "claude") return renderClaude(ir);
  if (model === "openai") return renderOpenAI(ir);
  throw new Error(`Unsupported render model: ${model}`);
}
