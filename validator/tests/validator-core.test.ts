import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { XmlAdapter } from "../src/adapters/xml-adapter.js";
import { TreeSitterAdapter } from "../src/adapters/tree-sitter-adapter.js";
import { validateDocument } from "../src/core/validator.js";
import { validateGeneratedText } from "../src/core/output-validator.js";

const ROOT = resolve("/Users/d-robotics/lab/nml/validator");

test("xml and tree-sitter parsers produce equivalent AST for happy path", () => {
  const xml = readFileSync(resolve(ROOT, "src/samples/happy-path.nml"), "utf-8");
  const xmlDoc = new XmlAdapter().parse(xml);
  const tsDoc = new TreeSitterAdapter().parse(xml);
  assert.deepEqual(tsDoc.root, xmlDoc.root);
});

test("validator catches missing location reference (E2202)", () => {
  const xml = readFileSync(resolve(ROOT, "src/samples/fail-missing-location.nml"), "utf-8");
  const doc = new XmlAdapter().parse(xml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E2202"));
});

test("generated text validator catches required/forbidden/ending issues", () => {
  const nml = `
<小说项目 名称="测试项目" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="r1" 姓名="甲"/>
    <地点 id="loc1" 名称="破庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="测试章">
      <场景 id="s1" 地点引用="loc1" 视角角色="r1">
        <任务 目标="测试"/>
        <信息揭示>
          <必须提及>旧伤复发</必须提及>
          <禁止提及>禁术来源</禁止提及>
        </信息揭示>
        <场景收束 类型="钩子" 落点="庙门轰然破开"/>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const generated = "林寻没有提及旧伤，但直接说出了禁术来源。";
  const issues = validateGeneratedText(doc, generated);
  assert.ok(issues.some((x) => x.code === "E3004"));
  assert.ok(issues.some((x) => x.code === "E3007"));
  assert.ok(issues.some((x) => x.code === "E3009"));
});

test("unknown extension tags are tolerated for forward-compatible DSL evolution", () => {
  const nml = `
<小说项目 名称="扩展测试" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="扩展章">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试扩展标签"/>
        <扩展标签 名称="系统面板" 版本="0.1">
          <字段 key="状态">异常</字段>
        </扩展标签>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new TreeSitterAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, true);
});

