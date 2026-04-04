import type { NmlDocument, AstNode } from "../types/ast.js";
import type { ValidationIssue, ValidationResult } from "../types/validation.js";
import { childrenOf, firstChild, walk } from "./node-utils.js";

const POV_ENUM = new Set(["第一人称", "第三人称限定"]);
const SCENE_PACE_ENUM = new Set(["慢", "中", "快", "慢转中", "中转快"]);
const ENDING_TYPE_ENUM = new Set(["转折", "悬念", "钩子", "回落"]);
const SEGMENT_FUNCTION_ENUM = new Set(["铺垫", "推进", "转折", "爆发", "回落", "钩子"]);
const SEGMENT_FOCUS_ENUM = new Set(["环境", "动作", "对话", "心理", "信息"]);
const SEGMENT_PACE_ENUM = new Set(["慢", "中", "快"]);
const INFO_POINT_TYPE_ENUM = new Set(["伏笔", "反转", "设定", "情绪", "冲突", "行动"]);
const STATE_PHASE_ENUM = new Set(["入", "出"]);
const RELATION_TYPE_ENUM = new Set(["敌对", "对抗", "戒备", "试探", "中立", "合作", "信任", "依赖", "背叛"]);
const RELATION_TYPE_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  敌对: ["敌对", "对抗", "戒备", "试探"],
  对抗: ["对抗", "敌对", "戒备", "试探"],
  戒备: ["戒备", "试探", "中立", "对抗"],
  试探: ["试探", "戒备", "中立", "合作"],
  中立: ["中立", "试探", "合作", "戒备"],
  合作: ["合作", "信任", "中立", "试探"],
  信任: ["信任", "依赖", "合作", "背叛"],
  依赖: ["依赖", "信任", "背叛"],
  背叛: ["背叛", "敌对", "对抗", "戒备"],
};
const STAMINA_LEVEL: Record<string, number> = {
  极低: 1,
  低: 2,
  中: 3,
  高: 4,
};
const MOOD_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  平静: ["平静", "克制", "紧绷"],
  克制: ["克制", "紧绷", "决绝", "平静"],
  紧绷: ["紧绷", "决绝", "麻木", "克制"],
  决绝: ["决绝", "麻木", "紧绷"],
  麻木: ["麻木", "平静", "克制"],
};
const SEGMENT_FUNCTION_ORDER: Record<string, number> = {
  铺垫: 1,
  推进: 2,
  转折: 3,
  爆发: 4,
  回落: 5,
  钩子: 6,
};

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

function isPositiveInteger(value: string): boolean {
  if (!/^\d+$/.test(value)) return false;
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function isIntegerInRange(value: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(value)) return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

function toNumber(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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

        const sceneWordTarget = scene.attributes["字数目标"];
        if (sceneWordTarget && !isPositiveInteger(sceneWordTarget)) {
          issues.push(issue("E1210", `Invalid 场景.字数目标 '${sceneWordTarget}', expected positive integer`, scenePath));
        }

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
          let segmentWordSum = 0;
          let segmentWordAllValid = true;
          const segmentFunctions: string[] = [];
          let segmentFunctionAllValid = true;
          const planMode = plan.attributes["校验"];
          const flowValidationEnabled = plan.attributes["流转校验"] === "开启";
          const stateValidationEnabled = plan.attributes["状态校验"] === "开启";
          const staminaEvolutionMode = plan.attributes["体力演化"];
          const relationValidationEnabled = plan.attributes["关系校验"] === "开启";
          const relationEvolutionMode = plan.attributes["关系演化"];
          const relationTypeEvolutionMode = plan.attributes["关系类型演化"];
          const segmentNodes = childrenOf(plan, "段");
          const lastOutByRole = new Map<string, { stamina?: string; mood?: string }>();
          const lastOutByRelation = new Map<string, { strength: number; type?: string }>();

          let alignmentThreshold: number | undefined;
          if (planMode === "对齐场景配比") {
            const thresholdRaw = plan.attributes["偏差上限"] ?? "15%";
            if (!isPercent(thresholdRaw)) {
              issues.push(issue("E3302", `Invalid 段落计划.偏差上限 '${thresholdRaw}', expected percent like 15%`, `${scenePath}/段落计划`));
            } else {
              alignmentThreshold = Number(thresholdRaw.slice(0, -1));
            }
          }

          let sceneDialogueRatio: number | undefined;
          let sceneActionRatio: number | undefined;
          if (planMode === "对齐场景配比") {
            const sceneRatio = firstChild(scene, "配比");
            sceneDialogueRatio = toNumber(sceneRatio?.attributes["对话"]);
            sceneActionRatio = toNumber(sceneRatio?.attributes["动作"]);
            const sceneRatioReady = sceneDialogueRatio != null && sceneActionRatio != null;
            if (!sceneRatioReady) {
              issues.push(issue("E3303", "Missing or invalid 场景.配比(对话/动作) for 段落计划 校验=对齐场景配比", `${scenePath}/配比`));
            }
          }
          for (const p of segmentNodes) {
            const segPath = `${scenePath}/段落计划/段`;
            const idx = p.attributes["序号"];
            if (idx) {
              if (seen.has(idx)) {
                issues.push(issue("E2105", `Duplicate 段.序号 '${idx}' in same 段落计划`, segPath));
              }
              seen.add(idx);
            }

            const segmentWordTarget = p.attributes["字数目标"];
            if (!segmentWordTarget) {
              issues.push(issue("E1311", "Missing required attribute '字数目标' on <段>", segPath));
              segmentWordAllValid = false;
            } else if (!isPositiveInteger(segmentWordTarget)) {
              issues.push(issue("E1312", `Invalid 段.字数目标 '${segmentWordTarget}', expected positive integer`, segPath));
              segmentWordAllValid = false;
            } else {
              segmentWordSum += Number(segmentWordTarget);
            }

            const segmentFunction = p.attributes["功能"];
            if (!segmentFunction) {
              issues.push(issue("E1313", "Missing required attribute '功能' on <段>", segPath));
              segmentFunctionAllValid = false;
            } else if (!SEGMENT_FUNCTION_ENUM.has(segmentFunction)) {
              issues.push(issue("E1314", `Invalid 段.功能 '${segmentFunction}'`, segPath));
              segmentFunctionAllValid = false;
            } else {
              segmentFunctions.push(segmentFunction);
            }

            const segmentFocus = p.attributes["焦点"];
            if (!segmentFocus) {
              issues.push(issue("E1315", "Missing required attribute '焦点' on <段>", segPath));
            } else if (!SEGMENT_FOCUS_ENUM.has(segmentFocus)) {
              issues.push(issue("E1316", `Invalid 段.焦点 '${segmentFocus}'`, segPath));
            }

            const segmentPace = p.attributes["节奏"];
            if (!segmentPace) {
              issues.push(issue("E1317", "Missing required attribute '节奏' on <段>", segPath));
            } else if (!SEGMENT_PACE_ENUM.has(segmentPace)) {
              issues.push(issue("E1318", `Invalid 段.节奏 '${segmentPace}'`, segPath));
            }

            if (planMode === "对齐场景配比") {
              const segmentDialogueRaw = p.attributes["对话占比"];
              const segmentActionRaw = p.attributes["动作占比"];

              let segmentDialogue: number | undefined;
              let segmentAction: number | undefined;

              if (!segmentDialogueRaw) {
                issues.push(issue("E1330", "Missing required attribute '对话占比' on <段> when 段落计划.校验=对齐场景配比", segPath));
              } else if (!isIntegerInRange(segmentDialogueRaw, 0, 100)) {
                issues.push(issue("E1331", `Invalid 段.对话占比 '${segmentDialogueRaw}', expected integer 0-100`, segPath));
              } else {
                segmentDialogue = Number(segmentDialogueRaw);
              }

              if (!segmentActionRaw) {
                issues.push(issue("E1332", "Missing required attribute '动作占比' on <段> when 段落计划.校验=对齐场景配比", segPath));
              } else if (!isIntegerInRange(segmentActionRaw, 0, 100)) {
                issues.push(issue("E1333", `Invalid 段.动作占比 '${segmentActionRaw}', expected integer 0-100`, segPath));
              } else {
                segmentAction = Number(segmentActionRaw);
              }

              const canCompare =
                alignmentThreshold != null &&
                sceneDialogueRatio != null &&
                sceneActionRatio != null &&
                segmentDialogue != null &&
                segmentAction != null;

              if (canCompare) {
                const threshold = alignmentThreshold as number;
                const sceneDialogue = sceneDialogueRatio as number;
                const sceneAction = sceneActionRatio as number;
                const segDialogue = segmentDialogue as number;
                const segAction = segmentAction as number;

                if (Math.abs(segDialogue - sceneDialogue) > threshold) {
                  issues.push(
                    issue(
                      "E3304",
                      `段.对话占比 (${segDialogue}) deviation exceeds 偏差上限 (${threshold}%) from 场景.配比.对话 (${sceneDialogue})`,
                      segPath,
                    ),
                  );
                }
                if (Math.abs(segAction - sceneAction) > threshold) {
                  issues.push(
                    issue(
                      "E3305",
                      `段.动作占比 (${segAction}) deviation exceeds 偏差上限 (${threshold}%) from 场景.配比.动作 (${sceneAction})`,
                      segPath,
                    ),
                  );
                }
              }
            }

            const segmentPov = p.attributes["视角"];
            const scenePov = scene.attributes["视角角色"];
            if (!segmentPov && !scenePov) {
              issues.push(issue("E2211", "Missing effective POV role for <段> (neither 段.视角 nor 场景.视角角色 is provided)", segPath, "warning"));
            }

            const stateNodes = childrenOf(p, "状态");
            const inStateByRole = new Map<string, { stamina?: string; mood?: string }>();
            const outStateByRole = new Map<string, { stamina?: string; mood?: string }>();
            for (const stateNode of stateNodes) {
              const role = stateNode.attributes["角色"];
              const phase = stateNode.attributes["阶段"];
              if (!role) {
                issues.push(issue("E1340", "Missing required attribute '角色' on <状态>", `${segPath}/状态`));
                continue;
              }
              if (!phase) {
                issues.push(issue("E1341", "Missing required attribute '阶段' on <状态>", `${segPath}/状态`));
                continue;
              }
              if (!STATE_PHASE_ENUM.has(phase)) {
                issues.push(issue("E1342", `Invalid 状态.阶段 '${phase}', expected 入|出`, `${segPath}/状态`));
                continue;
              }

              const snapshot = {
                stamina: stateNode.attributes["体力"],
                mood: stateNode.attributes["情绪"],
              };

              if (snapshot.stamina && STAMINA_LEVEL[snapshot.stamina] == null) {
                issues.push(issue("E1343", `Invalid 状态.体力 '${snapshot.stamina}', expected one of 极低|低|中|高`, `${segPath}/状态`));
              }
              if (snapshot.mood && MOOD_ALLOWED_TRANSITIONS[snapshot.mood] == null) {
                issues.push(issue("E1344", `Invalid 状态.情绪 '${snapshot.mood}', expected one of ${Object.keys(MOOD_ALLOWED_TRANSITIONS).join("|")}`, `${segPath}/状态`));
              }

              if (phase === "入") inStateByRole.set(role, snapshot);
              if (phase === "出") outStateByRole.set(role, snapshot);
            }

            if (stateValidationEnabled) {
              for (const [role, inState] of inStateByRole.entries()) {
                const prevOut = lastOutByRole.get(role);
                if (!prevOut) continue;
                if (prevOut.stamina && inState.stamina) {
                  if (staminaEvolutionMode === "同级或下降") {
                    const prevLevel = STAMINA_LEVEL[prevOut.stamina];
                    const currLevel = STAMINA_LEVEL[inState.stamina];
                    if (prevLevel != null && currLevel != null && currLevel > prevLevel) {
                      issues.push(
                        issue(
                          "E4203",
                          `状态演化不合法(体力上升): role='${role}', prev 出='${prevOut.stamina}', current 入='${inState.stamina}', mode=同级或下降`,
                          `${segPath}/状态`,
                          "warning",
                        ),
                      );
                    }
                  } else if (prevOut.stamina !== inState.stamina) {
                    issues.push(
                      issue(
                        "E4201",
                        `状态连续性不一致(体力): role='${role}', prev 出='${prevOut.stamina}', current 入='${inState.stamina}'`,
                        `${segPath}/状态`,
                        "warning",
                      ),
                    );
                  }
                }
                if (prevOut.mood && inState.mood) {
                  const moodEvolutionMode = plan.attributes["情绪演化"];
                  if (moodEvolutionMode === "受限迁移") {
                    const allowed = MOOD_ALLOWED_TRANSITIONS[prevOut.mood];
                    if (allowed && !allowed.includes(inState.mood)) {
                      issues.push(
                        issue(
                          "E4204",
                          `状态演化不合法(情绪迁移): role='${role}', prev 出='${prevOut.mood}', current 入='${inState.mood}', mode=受限迁移`,
                          `${segPath}/状态`,
                          "warning",
                        ),
                      );
                    }
                  } else if (prevOut.mood !== inState.mood) {
                    issues.push(
                      issue(
                        "E4202",
                        `状态连续性不一致(情绪): role='${role}', prev 出='${prevOut.mood}', current 入='${inState.mood}'`,
                        `${segPath}/状态`,
                        "warning",
                      ),
                    );
                  }
                }
              }
            }

            for (const [role, snapshot] of outStateByRole.entries()) {
              lastOutByRole.set(role, snapshot);
            }

            const relationNodes = childrenOf(p, "关系状态");
            const inRelationByPair = new Map<string, { strength: number; type?: string }>();
            const outRelationByPair = new Map<string, { strength: number; type?: string }>();
            for (const relationNode of relationNodes) {
              const srcRole = relationNode.attributes["角色"];
              const dstRole = relationNode.attributes["目标"];
              const phase = relationNode.attributes["阶段"];
              const strengthRaw = relationNode.attributes["强度"];
              const relationType = relationNode.attributes["类型"];

              if (!srcRole) {
                issues.push(issue("E1350", "Missing required attribute '角色' on <关系状态>", `${segPath}/关系状态`));
                continue;
              }
              if (!dstRole) {
                issues.push(issue("E1351", "Missing required attribute '目标' on <关系状态>", `${segPath}/关系状态`));
                continue;
              }
              if (!phase) {
                issues.push(issue("E1352", "Missing required attribute '阶段' on <关系状态>", `${segPath}/关系状态`));
                continue;
              }
              if (!STATE_PHASE_ENUM.has(phase)) {
                issues.push(issue("E1353", `Invalid 关系状态.阶段 '${phase}', expected 入|出`, `${segPath}/关系状态`));
                continue;
              }
              if (!strengthRaw) {
                issues.push(issue("E1354", "Missing required attribute '强度' on <关系状态>", `${segPath}/关系状态`));
                continue;
              }
              if (!isIntegerInRange(strengthRaw, 1, 5)) {
                issues.push(issue("E1355", `Invalid 关系状态.强度 '${strengthRaw}', expected integer 1-5`, `${segPath}/关系状态`));
                continue;
              }
              if (relationType && !RELATION_TYPE_ENUM.has(relationType)) {
                issues.push(
                  issue(
                    "E1356",
                    `Invalid 关系状态.类型 '${relationType}', expected one of ${Array.from(RELATION_TYPE_ENUM).join("|")}`,
                    `${segPath}/关系状态`,
                  ),
                );
                continue;
              }
              if (relationTypeEvolutionMode && !relationType) {
                issues.push(
                  issue(
                    "E1357",
                    `Missing required attribute '类型' on <关系状态> when 段落计划.关系类型演化=${relationTypeEvolutionMode}`,
                    `${segPath}/关系状态`,
                  ),
                );
                continue;
              }

              const key = `${srcRole}->${dstRole}`;
              const snapshot = { strength: Number(strengthRaw), type: relationType };
              if (phase === "入") inRelationByPair.set(key, snapshot);
              if (phase === "出") outRelationByPair.set(key, snapshot);
            }

            if (relationValidationEnabled) {
              for (const [pair, inRelation] of inRelationByPair.entries()) {
                const prevOut = lastOutByRelation.get(pair);
                if (!prevOut) continue;
                if (relationEvolutionMode === "波动不超过1") {
                  if (Math.abs(inRelation.strength - prevOut.strength) > 1) {
                    issues.push(
                      issue(
                        "E4302",
                        `关系演化不合法(波动超限): pair='${pair}', prev 出='${prevOut.strength}', current 入='${inRelation.strength}', mode=波动不超过1`,
                        `${segPath}/关系状态`,
                        "warning",
                      ),
                    );
                  }
                } else if (inRelation.strength !== prevOut.strength) {
                  issues.push(
                    issue(
                      "E4301",
                      `关系连续性不一致(强度): pair='${pair}', prev 出='${prevOut.strength}', current 入='${inRelation.strength}'`,
                      `${segPath}/关系状态`,
                      "warning",
                    ),
                  );
                }

                if (relationTypeEvolutionMode === "严格一致") {
                  if (prevOut.type && inRelation.type && prevOut.type !== inRelation.type) {
                    issues.push(
                      issue(
                        "E4303",
                        `关系类型连续性不一致: pair='${pair}', prev 出='${prevOut.type}', current 入='${inRelation.type}', mode=严格一致`,
                        `${segPath}/关系状态`,
                        "warning",
                      ),
                    );
                  }
                } else if (relationTypeEvolutionMode === "受限迁移") {
                  if (prevOut.type && inRelation.type) {
                    const allowed = RELATION_TYPE_ALLOWED_TRANSITIONS[prevOut.type];
                    if (allowed && !allowed.includes(inRelation.type)) {
                      issues.push(
                        issue(
                          "E4304",
                          `关系类型演化不合法: pair='${pair}', prev 出='${prevOut.type}', current 入='${inRelation.type}', mode=受限迁移`,
                          `${segPath}/关系状态`,
                          "warning",
                        ),
                      );
                    }
                  }
                }
              }
            }

            for (const [pair, snapshot] of outRelationByPair.entries()) {
              lastOutByRelation.set(pair, snapshot);
            }

            const infoPointNodes = childrenOf(p, "信息点");
            const infoPoints = infoPointNodes.map((x) => (x.text ?? "").trim()).filter(Boolean);
            if (infoPoints.length < 1) {
              issues.push(issue("E1319", "<段> must contain at least one non-empty <信息点>", segPath));
            }
            for (const infoPointNode of infoPointNodes) {
              const pointType = infoPointNode.attributes["类型"];
              if (!pointType) {
                issues.push(issue("E1320", "Missing required attribute '类型' on <信息点>", `${segPath}/信息点`));
              } else if (!INFO_POINT_TYPE_ENUM.has(pointType)) {
                issues.push(issue("E1321", `Invalid 信息点.类型 '${pointType}'`, `${segPath}/信息点`));
              }

              const pointWeight = infoPointNode.attributes["权重"];
              if (!pointWeight) {
                issues.push(issue("E1322", "Missing required attribute '权重' on <信息点>", `${segPath}/信息点`));
              } else if (!isIntegerInRange(pointWeight, 1, 5)) {
                issues.push(issue("E1323", `Invalid 信息点.权重 '${pointWeight}', expected integer 1-5`, `${segPath}/信息点`));
              }
            }
          }

          if (planMode === "和等于场景字数目标" && sceneWordTarget && isPositiveInteger(sceneWordTarget) && segmentWordAllValid) {
            const sceneTarget = Number(sceneWordTarget);
            if (segmentWordSum !== sceneTarget) {
              issues.push(
                issue(
                  "E3301",
                  `段落计划.字数目标 sum (${segmentWordSum}) must equal 场景.字数目标 (${sceneTarget}) when 校验=和等于场景字数目标`,
                  `${scenePath}/段落计划`,
                ),
              );
            }
          }

          // Narrative flow warnings for 段.功能 sequence
          if (flowValidationEnabled && segmentFunctionAllValid && segmentFunctions.length > 0) {
            const first = segmentFunctions[0]!;
            if (!(first === "铺垫" || first === "推进")) {
              issues.push(issue("E4102", `段功能起始建议为 铺垫|推进, got '${first}'`, `${scenePath}/段落计划`, "warning"));
            }

            const last = segmentFunctions[segmentFunctions.length - 1]!;
            if (!(last === "转折" || last === "爆发" || last === "钩子" || last === "回落")) {
              issues.push(issue("E4103", `段功能收束建议为 转折|爆发|钩子|回落, got '${last}'`, `${scenePath}/段落计划`, "warning"));
            }

            for (let i = 1; i < segmentFunctions.length; i++) {
              const prev = segmentFunctions[i - 1]!;
              const curr = segmentFunctions[i]!;
              if (SEGMENT_FUNCTION_ORDER[curr] < SEGMENT_FUNCTION_ORDER[prev]) {
                issues.push(
                  issue(
                    "E4101",
                    `段功能顺序逆行: '${prev}' -> '${curr}'`,
                    `${scenePath}/段落计划`,
                    "warning",
                  ),
                );
                break;
              }
            }

            if (pace === "快") {
              const fallbackCount = segmentFunctions.filter((x) => x === "回落").length;
              if (fallbackCount > 1) {
                issues.push(issue("E4104", `快节奏场景中 回落 段数量建议 <= 1, got ${fallbackCount}`, `${scenePath}/段落计划`, "warning"));
              }
            }
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

    if (node.tag === "段") {
      const roleRef = node.attributes["视角"];
      if (roleRef && !roleIds.has(roleRef)) {
        issues.push(issue("E2210", `Missing role ref '${roleRef}' on 段.视角`, path, "warning"));
      }
    }

    if (node.tag === "状态") {
      const roleRef = node.attributes["角色"];
      if (roleRef && !roleIds.has(roleRef)) {
        issues.push(issue("E2212", `Missing role ref '${roleRef}' on 状态.角色`, path, "warning"));
      }
    }

    if (node.tag === "关系状态") {
      const srcRef = node.attributes["角色"];
      const dstRef = node.attributes["目标"];
      if (srcRef && !roleIds.has(srcRef)) {
        issues.push(issue("E2213", `Missing role ref '${srcRef}' on 关系状态.角色`, path, "warning"));
      }
      if (dstRef && !roleIds.has(dstRef)) {
        issues.push(issue("E2214", `Missing role ref '${dstRef}' on 关系状态.目标`, path, "warning"));
      }
    }
  });

  const passed = !issues.some((x) => x.severity === "error");
  return { passed, issues };
}
