import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { XmlAdapter } from "../src/adapters/xml-adapter.js";
import { compilePromptIR } from "../src/compiler/prompt-ir.js";
import { runCompile } from "../src/app/compile.js";

const ROOT = resolve("/Users/d-robotics/lab/nml/validator");

test("compilePromptIR maps chapter-scene-segment structure", () => {
  const nml = `
<小说项目 名称="测试项目" 版本="2.1-M1">
  <元数据>
    <写作准则 文风="冷峻简练" 视角="第三人称限定" 细节度="3"/>
  </元数据>
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="残阳如血">
      <章节蓝图 字数目标="3000" 章节目标="主角绝境求生" 章节钩子="黑袍首领识别禁术"/>
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a" 字数目标="900" 节奏="慢" 氛围="压抑,肃杀">
        <任务 目标="建立围压"/>
        <信息揭示>
          <必须提及>旧伤复发</必须提及>
          <禁止提及>禁术来源</禁止提及>
        </信息揭示>
        <段落计划>
          <段 序号="1" 字数目标="300" 功能="铺垫" 焦点="环境" 节奏="慢">
            <信息点 类型="设定" 权重="2">空间压迫感建立</信息点>
          </段>
        </段落计划>
        <场景收束 类型="钩子" 落点="庙门轰然破开"/>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();

  const doc = new XmlAdapter().parse(nml);
  const ir = compilePromptIR(doc);

  assert.equal(ir.irVersion, "1.1");
  assert.equal(ir.project.name, "测试项目");
  assert.equal(ir.chapter.targetWords, 3000);
  assert.equal(ir.scenes.length, 1);
  assert.equal(ir.scenes[0]?.locationName, "荒庙");
  assert.deepEqual(ir.scenes[0]?.mustMention, ["旧伤复发"]);
  assert.deepEqual(ir.scenes[0]?.mustNotMention, ["禁术来源"]);
  assert.equal(ir.scenes[0]?.segments.length, 1);
  assert.equal(ir.scenes[0]?.segments[0]?.infoPoints[0]?.type, "设定");
  assert.equal(ir.normalized.scenes[0]?.pace, "慢");
  assert.deepEqual(ir.normalized.scenes[0]?.paceStages, ["慢"]);
  assert.equal(ir.resolvedConstraints.priorityOrder[0], "禁止提及");
  assert.ok(ir.generationPlan.some((x) => x.label === "SceneGoal"));
  assert.ok(ir.acceptancePlan.some((x) => x.check === "ENDING_BEAT_HIT"));
});

test("compilePromptIR resolves overlap conflict with forbidden-first policy", () => {
  const nml = `
<小说项目 名称="测试项目" 版本="2.1-M1">
  <元数据 />
  <设定集><地点 id="loc_a" 名称="荒庙"/></设定集>
  <正文>
    <章节 序号="1" 标题="T">
      <场景 id="s1" 地点引用="loc_a" 节奏="慢速">
        <任务 目标="测试冲突裁决"/>
        <信息揭示>
          <必须提及>禁术来源</必须提及>
          <禁止提及>禁术来源</禁止提及>
        </信息揭示>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const ir = compilePromptIR(new XmlAdapter().parse(nml));
  assert.equal(ir.normalized.scenes[0]?.pace, "慢");
  assert.deepEqual(ir.normalized.scenes[0]?.overlapMentions, ["禁术来源"]);
  assert.ok(
    ir.resolvedConstraints.conflictResolutions.some(
      (x) => x.code === "CONFLICT_REQUIRED_FORBIDDEN" && x.detail.includes("禁止提及优先"),
    ),
  );
});

test("runCompile returns validation issues and no IR when document invalid", () => {
  const file = resolve(ROOT, "src/samples/fail-missing-location.nml");
  const out = runCompile({
    file,
    parser: "xml",
  });

  assert.equal(out.ir, undefined);
  assert.ok(out.validation.issues.some((x) => x.code === "E2202"));
});

test("runCompile builds IR for valid sample", () => {
  const file = resolve(ROOT, "src/samples/happy-path.nml");
  const out = runCompile({
    file,
    parser: "tree-sitter",
  });

  assert.ok(out.ir);
  assert.equal(out.ir?.project.name, "剑起大荒");
  assert.equal(out.ir?.chapter.index, 1);
  assert.equal(out.ir?.scenes[0]?.id, "s1");
});
