import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderPrompt } from "../src/renderer/prompt-renderer.js";
import { runRender } from "../src/app/render.js";
import type { PromptIR } from "../src/types/prompt-ir.js";

const ROOT = resolve("/Users/d-robotics/lab/nml/validator");

const SAMPLE_IR: PromptIR = {
  irVersion: "1.1",
  project: {
    name: "测试项目",
    nmlVersion: "2.1-M1",
    style: "冷峻简练",
    pov: "第三人称限定",
  },
  chapter: {
    index: 1,
    title: "残阳如血",
    targetWords: 3000,
    goal: "主角绝境求生",
    hook: "对手识别禁术",
  },
  scenes: [
    {
      id: "s1",
      locationRef: "loc_a",
      locationName: "荒庙",
      povRole: "char_a",
      pace: "慢",
      atmosphere: ["压抑", "肃杀"],
      targetWords: 900,
      task: "建立围压",
      mustMention: ["旧伤复发"],
      mustNotMention: ["禁术来源"],
      segments: [
        {
          index: 1,
          targetWords: 300,
          func: "铺垫",
          focus: "环境",
          pace: "慢",
          infoPoints: [{ type: "设定", weight: 2, text: "空间压迫感建立" }],
          states: [],
          relationStates: [],
        },
      ],
      ending: { type: "钩子", beat: "庙门轰然破开" },
    },
  ],
  normalized: {
    scenes: [
      {
        sceneId: "s1",
        pace: "慢",
        paceStages: ["慢"],
        atmosphere: ["压抑", "肃杀"],
        mustMention: ["旧伤复发"],
        mustNotMention: ["禁术来源"],
        overlapMentions: [],
        segmentFunctions: ["铺垫"],
      },
    ],
    unknownTokens: [],
  },
  resolvedConstraints: {
    priorityOrder: ["禁止提及", "必须提及"],
    hardConstraints: [{ scope: "scene:s1", code: "FORBIDDEN_MENTION", detail: "禁术来源" }],
    softConstraints: [{ scope: "scene:s1", code: "REQUIRED_MENTION", detail: "旧伤复发" }],
    conflictResolutions: [],
  },
  generationPlan: [{ sceneId: "s1", stepNo: 1, label: "SceneGoal", guidance: "建立围压", targetWords: 900 }],
  acceptancePlan: [{ scope: "scene:s1", check: "ENDING_BEAT_HIT", required: true }],
};

test("renderPrompt outputs claude style prompt", () => {
  const prompt = renderPrompt(SAMPLE_IR, "claude");
  assert.match(prompt, /你是长篇网文写作代理/);
  assert.match(prompt, /章节: 第1章《残阳如血》/);
  assert.match(prompt, /场景 s1/);
});

test("renderPrompt outputs openai style prompt", () => {
  const prompt = renderPrompt(SAMPLE_IR, "openai");
  assert.match(prompt, /Role: Chinese web-novel chapter writer/);
  assert.match(prompt, /SceneSpecs\(JSON\)/);
  assert.match(prompt, /"id": "s1"/);
});

test("runRender reads IR file and writes output file", () => {
  const irPath = resolve(ROOT, "reports/test.prompt-ir.json");
  const outPath = resolve(ROOT, "reports/test.final-prompt.txt");
  writeFileSync(irPath, JSON.stringify(SAMPLE_IR, null, 2), "utf-8");
  if (existsSync(outPath)) rmSync(outPath, { force: true });

  const out = runRender({
    irFile: irPath,
    model: "claude",
    outFile: outPath,
  });

  assert.equal(out.model, "claude");
  assert.equal(out.outFile, outPath);
  assert.equal(existsSync(outPath), true);
  assert.match(out.prompt, /测试项目/);
});
