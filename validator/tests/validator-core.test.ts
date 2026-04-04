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

test("segment attributes are validated in 段落计划", () => {
  const nml = `
<小说项目 名称="段测试" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试段属性规则"/>
        <段落计划>
          <段 序号="1" 字数目标="abc" 功能="叙事" 焦点="景别" 节奏="中">
            <信息点 类型="行动" 权重="3">动作推进</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1312"));
  assert.ok(result.issues.some((x) => x.code === "E1314"));
  assert.ok(result.issues.some((x) => x.code === "E1316"));
});

test("segment pace and info-point rules are validated", () => {
  const nml = `
<小说项目 名称="段测试2" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试2">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试段节奏和信息点规则"/>
        <段落计划>
          <段 序号="1" 字数目标="120" 功能="推进" 焦点="动作" 节奏="疾速"></段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1318"));
  assert.ok(result.issues.some((x) => x.code === "E1319"));
});

test("info-point type attribute is validated", () => {
  const nml = `
<小说项目 名称="段测试3" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试3">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试信息点类型规则"/>
        <段落计划>
          <段 序号="1" 字数目标="120" 功能="推进" 焦点="动作" 节奏="中">
            <信息点 权重="3">无类型</信息点>
            <信息点 类型="线索" 权重="3">非法类型</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1320"));
  assert.ok(result.issues.some((x) => x.code === "E1321"));
});

test("info-point weight and segment-sum consistency are validated", () => {
  const nml = `
<小说项目 名称="段测试4" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试4">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a" 字数目标="300">
        <任务 目标="测试信息点权重和段落字数一致性"/>
        <段落计划 校验="和等于场景字数目标">
          <段 序号="1" 字数目标="120" 功能="铺垫" 焦点="环境" 节奏="慢">
            <信息点 类型="设定">缺权重</信息点>
          </段>
          <段 序号="2" 字数目标="140" 功能="推进" 焦点="动作" 节奏="中">
            <信息点 类型="行动" 权重="9">非法权重</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1322"));
  assert.ok(result.issues.some((x) => x.code === "E1323"));
  assert.ok(result.issues.some((x) => x.code === "E3301"));
});

test("segment POV inherits scene POV, supports override, and warns on invalid refs", () => {
  const nml = `
<小说项目 名称="段测试5" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <角色 id="char_b" 姓名="乙"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试5">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试段视角继承与覆盖"/>
        <段落计划>
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <信息点 类型="设定" 权重="2">继承场景视角</信息点>
          </段>
          <段 序号="2" 字数目标="120" 功能="推进" 焦点="动作" 节奏="中" 视角="char_b">
            <信息点 类型="行动" 权重="4">覆盖到乙视角</信息点>
          </段>
          <段 序号="3" 字数目标="120" 功能="推进" 焦点="动作" 节奏="中" 视角="char_missing">
            <信息点 类型="行动" 权重="3">错误视角引用</信息点>
          </段>
        </段落计划>
      </场景>
      <场景 id="s2" 地点引用="loc_a">
        <任务 目标="测试段有效视角缺失告警"/>
        <段落计划>
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <信息点 类型="设定" 权重="2">无有效视角</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, true);
  assert.ok(result.issues.some((x) => x.code === "E2210"));
  assert.ok(result.issues.some((x) => x.code === "E2211"));
});

test("segment ratio alignment against scene ratio is validated", () => {
  const nml = `
<小说项目 名称="段测试6" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试6">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试段配比对齐"/>
        <配比 对话="30" 动作="40"/>
        <段落计划 校验="对齐场景配比" 偏差上限="10%">
          <段 序号="1" 字数目标="120" 功能="推进" 焦点="动作" 节奏="中" 对话占比="30" 动作占比="60">
            <信息点 类型="行动" 权重="3">动作推进</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E3305"));
});

test("scene word target must be positive integer when provided", () => {
  const nml = `
<小说项目 名称="段测试7" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="场景字数目标非法">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a" 字数目标="-1">
        <任务 目标="测试场景字数目标非法"/>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1210"));
});

test("segment function flow warnings are emitted for reverse/start/end/fast-fallback cases", () => {
  const nml = `
<小说项目 名称="段测试8" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试8">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a" 节奏="快">
        <任务 目标="测试段功能流转告警"/>
        <段落计划 流转校验="开启">
          <段 序号="1" 字数目标="100" 功能="爆发" 焦点="动作" 节奏="快">
            <信息点 类型="冲突" 权重="5">起始异常</信息点>
          </段>
          <段 序号="2" 字数目标="100" 功能="回落" 焦点="心理" 节奏="慢">
            <信息点 类型="情绪" 权重="3">回落1</信息点>
          </段>
          <段 序号="3" 字数目标="100" 功能="回落" 焦点="心理" 节奏="慢">
            <信息点 类型="情绪" 权重="3">回落2</信息点>
          </段>
          <段 序号="4" 字数目标="100" 功能="推进" 焦点="动作" 节奏="中">
            <信息点 类型="行动" 权重="3">顺序逆行</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, true);
  assert.ok(result.issues.some((x) => x.code === "E4101"));
  assert.ok(result.issues.some((x) => x.code === "E4102"));
  assert.ok(result.issues.some((x) => x.code === "E4103"));
  assert.ok(result.issues.some((x) => x.code === "E4104"));
});

test("segment state tags are validated and continuity warnings are emitted", () => {
  const nml = `
<小说项目 名称="段测试9" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试9">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试状态标签与连续性"/>
        <段落计划 状态校验="开启">
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <状态 角色="char_a" 阶段="出" 体力="低" 情绪="紧绷"/>
            <状态 角色="char_missing" 阶段="入"/>
            <信息点 类型="设定" 权重="2">第一段</信息点>
          </段>
          <段 序号="2" 字数目标="100" 功能="推进" 焦点="动作" 节奏="中">
            <状态 角色="char_a" 阶段="入" 体力="中" 情绪="平静"/>
            <状态 角色="char_a" 阶段="中"/>
            <状态 阶段="入"/>
            <信息点 类型="行动" 权重="3">第二段</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1340"));
  assert.ok(result.issues.some((x) => x.code === "E1342"));
  assert.ok(result.issues.some((x) => x.code === "E2212"));
  assert.ok(result.issues.some((x) => x.code === "E4201"));
  assert.ok(result.issues.some((x) => x.code === "E4202"));
});

test("state stamina evolution mode allows same-or-down and warns on rise", () => {
  const nml = `
<小说项目 名称="段测试10" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试10">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试体力演化模式"/>
        <段落计划 状态校验="开启" 体力演化="同级或下降">
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <状态 角色="char_a" 阶段="出" 体力="低" 情绪="紧绷"/>
            <信息点 类型="设定" 权重="2">第一段</信息点>
          </段>
          <段 序号="2" 字数目标="100" 功能="推进" 焦点="动作" 节奏="中">
            <状态 角色="char_a" 阶段="入" 体力="中" 情绪="紧绷"/>
            <状态 角色="char_a" 阶段="出" 体力="满" 情绪="紧绷"/>
            <信息点 类型="行动" 权重="3">第二段</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E4203"));
  assert.ok(result.issues.some((x) => x.code === "E1343"));
  assert.ok(!result.issues.some((x) => x.code === "E4201"));
});

test("state mood evolution mode validates allowed transitions", () => {
  const nml = `
<小说项目 名称="段测试11" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试11">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试情绪演化模式"/>
        <段落计划 状态校验="开启" 情绪演化="受限迁移">
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <状态 角色="char_a" 阶段="出" 体力="中" 情绪="平静"/>
            <信息点 类型="设定" 权重="2">第一段</信息点>
          </段>
          <段 序号="2" 字数目标="100" 功能="推进" 焦点="动作" 节奏="中">
            <状态 角色="char_a" 阶段="入" 体力="中" 情绪="麻木"/>
            <状态 角色="char_a" 阶段="出" 体力="中" 情绪="暴走"/>
            <信息点 类型="行动" 权重="3">第二段</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E4204"));
  assert.ok(result.issues.some((x) => x.code === "E1344"));
  assert.ok(!result.issues.some((x) => x.code === "E4202"));
});

test("relation status tags and relation evolution are validated", () => {
  const nml = `
<小说项目 名称="段测试12" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <角色 id="char_b" 姓名="乙"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试12">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试关系状态标签与演化"/>
        <段落计划 关系校验="开启" 关系演化="波动不超过1">
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <关系状态 角色="char_missing" 目标="char_b" 阶段="入" 强度="7"/>
            <关系状态 角色="char_a" 目标="char_b" 阶段="出" 强度="1"/>
            <信息点 类型="设定" 权重="2">第一段</信息点>
          </段>
          <段 序号="2" 字数目标="100" 功能="推进" 焦点="动作" 节奏="中">
            <关系状态 角色="char_a" 目标="char_b" 阶段="入" 强度="4"/>
            <信息点 类型="行动" 权重="3">第二段</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1355"));
  assert.ok(result.issues.some((x) => x.code === "E2213"));
  assert.ok(result.issues.some((x) => x.code === "E4302"));
});

test("relation type evolution mode validates transition matrix", () => {
  const nml = `
<小说项目 名称="段测试13" 版本="2.1-M1">
  <元数据 />
  <设定集>
    <角色 id="char_a" 姓名="甲"/>
    <角色 id="char_b" 姓名="乙"/>
    <地点 id="loc_a" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="段规则测试13">
      <场景 id="s1" 地点引用="loc_a" 视角角色="char_a">
        <任务 目标="测试关系类型迁移"/>
        <段落计划 关系校验="开启" 关系类型演化="受限迁移">
          <段 序号="1" 字数目标="100" 功能="铺垫" 焦点="环境" 节奏="慢">
            <关系状态 角色="char_a" 目标="char_b" 阶段="出" 强度="2" 类型="敌对"/>
            <关系状态 角色="char_b" 目标="char_a" 阶段="入" 强度="2" 类型="陌生"/>
            <信息点 类型="设定" 权重="2">第一段</信息点>
          </段>
          <段 序号="2" 字数目标="100" 功能="推进" 焦点="动作" 节奏="中">
            <关系状态 角色="char_a" 目标="char_b" 阶段="入" 强度="2" 类型="信任"/>
            <关系状态 角色="char_b" 目标="char_a" 阶段="出" 强度="2"/>
            <信息点 类型="行动" 权重="3">第二段</信息点>
          </段>
        </段落计划>
      </场景>
    </章节>
  </正文>
</小说项目>
`.trim();
  const doc = new XmlAdapter().parse(nml);
  const result = validateDocument(doc);
  assert.equal(result.passed, false);
  assert.ok(result.issues.some((x) => x.code === "E1356"));
  assert.ok(result.issues.some((x) => x.code === "E1357"));
  assert.ok(result.issues.some((x) => x.code === "E4304"));
});
