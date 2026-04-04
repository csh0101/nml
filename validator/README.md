# NML Validator (MVP)

Current stack:
- TypeScript + Node.js
- XML parser adapter: `fast-xml-parser`
- Tree-sitter adapter: `tree-sitter` + `@tree-sitter-grammars/tree-sitter-xml`
- Rust nom adapter (prototype): `parser-rs` (`rust-nom`)
- MCP server: `nml_check`, `nml_regress`

## Commands

```bash
cd validator
npm install

# XML adapter
npm run check -- src/samples/happy-path.nml --parser xml

# Tree-sitter adapter
npm run check -- src/samples/happy-path.nml --parser tree-sitter

# Rust nom adapter (requires ../parser-rs and cargo)
npm run check -- src/samples/happy-path.nml --parser rust-nom

# Compile NML -> Prompt IR JSON
npm run compile -- src/samples/happy-path.nml --parser tree-sitter --out reports/happy.prompt-ir.json

# Render Prompt IR -> final prompt text
npm run render -- reports/happy.prompt-ir.json --model claude --out reports/happy.prompt.txt

# Inspect AST and tag statistics
npm run inspect -- src/samples/happy-path.nml --parser tree-sitter --ast-json-out reports/happy.ast.json

# Regression suite (supports generated-text expectations via .expect.json)
npm run regress -- --parser xml
npm run regress -- --parser tree-sitter
npm run regress -- --parser rust-nom

# Full suite including rust-nom parser regression
npm run unittest:all

# Validate generated text against 信息揭示/收束 + write report
npm run check -- src/samples/regression/hp_001_basic_scene.nml \
  --parser tree-sitter \
  --generated-text src/samples/generated/happy.txt \
  --report-out reports/happy.report.json

# Unit tests
npm run test
npm run test:watch

# Start MCP server (stdio)
npm run mcp
```

Prompt IR (v1.1) includes:
- `normalized`: deterministic normalization result (pace stages, deduped mentions, unknown tokens)
- `resolvedConstraints`: hard/soft constraints + conflict resolution (forbidden-first)
- `generationPlan`: scene/segment generation steps
- `acceptancePlan`: post-generation checks

Suggested pipeline:
1. `npm run compile -- <chapter.nml> --parser tree-sitter --out reports/ch.prompt-ir.json`
2. `npm run render -- reports/ch.prompt-ir.json --model claude --out reports/ch.prompt.txt`

## MCP Server 接入

`npm run mcp` 启动的是 **stdio 模式** MCP 服务，不是 HTTP 端口服务。

- 命令行直接运行时，如果上游客户端没有持续保持 stdio 连接，进程会退出，这是正常现象。
- 正确方式是由 MCP Host（如支持 MCP 的 IDE/Agent）拉起该命令并保持会话。

示例（Host 侧配置思路）：

```json
{
  "mcpServers": {
    "nml-validator": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/Users/d-robotics/lab/nml/validator"
    }
  }
}
```

也可以直接用 node：

```json
{
  "mcpServers": {
    "nml-validator": {
      "command": "node",
      "args": ["dist/src/mcp/server.js"],
      "cwd": "/Users/d-robotics/lab/nml/validator"
    }
  }
}
```

## MCP Tools
- `nml_check`
  - input: `file`, optional `parser`, `generatedTextFile`, `reportOutFile`
  - output: `passed`, `issues`, `reportOutFile`
- `nml_regress`
  - input: optional `parser`, `baseDir`
  - output: `total`, `failed`, `failedCases`

## Parser/Validation 可观测性

你可以用同一份 NML 在两种 parser 上分别跑并对比报告，确认 parser 行为差异是否为 0：

```bash
npm run check -- src/samples/happy-path.nml --parser xml --report-out reports/xml.report.json
npm run check -- src/samples/happy-path.nml --parser tree-sitter --report-out reports/ts.report.json
```

报告里可直接看到：
- `issues[].code`: 命中的规则编号（如 `E2202`）
- `issues[].path`: 触发节点路径（定位到章节/场景）
- `issues[].message`: 具体失败原因
- `metrics`: 输入/输出文本维度统计

语义校验（生成文本）会追加：
- `E3004`: 必须提及缺失
- `E3007`: 禁止提及命中
- `E3009`: 收束落点未命中

## 段落计划规则（新增）

当场景包含 `<段落计划>` 时，`<段>` 支持并校验：
- `序号`：用于场景内去重（重复报 `E2105`）
- `字数目标`：必填，正整数（缺失 `E1311`，非法 `E1312`）
- `功能`：必填，枚举 `铺垫|推进|转折|爆发|回落|钩子`（缺失 `E1313`，非法 `E1314`）
- `焦点`：必填，枚举 `环境|动作|对话|心理|信息`（缺失 `E1315`，非法 `E1316`）
- `节奏`：必填，枚举 `慢|中|快`（缺失 `E1317`，非法 `E1318`）
- `<信息点>`：每个 `<段>` 至少 1 条非空（缺失 `E1319`）
- `<信息点 类型>`：`类型` 必填，枚举 `伏笔|反转|设定|情绪|冲突|行动`（缺失 `E1320`，非法 `E1321`）
- `<信息点 权重>`：`权重` 必填，整数 `1-5`（缺失 `E1322`，非法 `E1323`）

可选一致性校验：
- `<段落计划 校验="和等于场景字数目标">` 时，若 `<场景 字数目标>` 和各 `<段 字数目标>` 都合法，要求段落和严格等于场景目标（不等报 `E3301`）

视角规则：
- `<段 视角>` 可选；未提供时默认继承 `<场景 视角角色>`
- 若 `<段 视角>` 提供但角色不存在，告警 `E2210`
- 若 `<段 视角>` 与 `<场景 视角角色>` 都未提供，告警 `E2211`

段配比对齐规则（可选）：
- 开启方式：`<段落计划 校验="对齐场景配比" 偏差上限="10%">`
- 依赖：同场景需有 `<配比 对话=".." 动作=".."/>`（缺失/非法报 `E3303`）
- `偏差上限` 必须是百分比格式（非法报 `E3302`）
- 每个段需提供：
  - `对话占比`（缺失 `E1330`，非法 `E1331`）
  - `动作占比`（缺失 `E1332`，非法 `E1333`）
- 超出偏差上限时报错：
  - 对话：`E3304`
  - 动作：`E3305`

段功能流转规则（warning）：
- 开启方式：`<段落计划 流转校验="开启">`
- 建议顺序：`铺垫 -> 推进 -> 转折 -> 爆发 -> 回落 -> 钩子`（允许子集）
- 若出现逆行（如 `推进 -> 铺垫`），告警 `E4101`
- 首段建议 `铺垫|推进`，否则告警 `E4102`
- 末段建议 `转折|爆发|钩子|回落`，否则告警 `E4103`
- 场景 `节奏="快"` 且 `回落` 段超过 1 个，告警 `E4104`

段状态连续性规则（可选）：
- 开启方式：`<段落计划 状态校验="开启">`
- 可选模式：`体力演化="同级或下降"`（启用后改为“体力不允许上升”而非严格相等）
- 可选模式：`情绪演化="受限迁移"`（启用后按内置情绪迁移矩阵校验）
- `<状态>` 标签属性：
  - `角色` 必填（缺失 `E1340`）
  - `阶段` 必填，枚举 `入|出`（缺失 `E1341`，非法 `E1342`）
  - `体力`、`情绪` 可选；`体力` 若提供必须为 `极低|低|中|高`（非法 `E1343`）
  - `情绪` 若提供必须为 `平静|克制|紧绷|决绝|麻木`（非法 `E1344`）
- 引用校验：
  - `状态.角色` 不存在，告警 `E2212`
- 连续性校验（同角色跨段）：
  - 上一段 `出.体力` 与下一段 `入.体力` 不一致，告警 `E4201`
  - 上一段 `出.情绪` 与下一段 `入.情绪` 不一致，告警 `E4202`
  - 若启用 `体力演化="同级或下降"`，体力上升告警 `E4203`（并替代 `E4201` 的体力严格相等逻辑）
  - 若启用 `情绪演化="受限迁移"`，情绪迁移不在允许集合内告警 `E4204`（并替代 `E4202` 的情绪严格相等逻辑）

关系演化规则（可选）：
- 开启方式：`<段落计划 关系校验="开启">`
- `<关系状态>` 标签属性：
  - `角色` 必填（缺失 `E1350`）
  - `目标` 必填（缺失 `E1351`）
  - `阶段` 必填，枚举 `入|出`（缺失 `E1352`，非法 `E1353`）
  - `强度` 必填，整数 `1-5`（缺失 `E1354`，非法 `E1355`）
  - `类型` 可选，若提供必须为 `敌对|对抗|戒备|试探|中立|合作|信任|依赖|背叛`（非法 `E1356`）
  - 当设置 `关系类型演化` 时，`类型` 变为必填（缺失 `E1357`）
- 引用校验：
  - `关系状态.角色` 不存在，告警 `E2213`
  - `关系状态.目标` 不存在，告警 `E2214`
- 连续性/演化：
  - 默认（关系校验开启）要求上一段 `出.强度` 与下一段 `入.强度` 一致，不一致告警 `E4301`
  - 若设置 `关系演化="波动不超过1"`，则允许波动 1，超限告警 `E4302`
  - 若设置 `关系类型演化="严格一致"`，上一段 `出.类型` 与下一段 `入.类型` 不一致告警 `E4303`
  - 若设置 `关系类型演化="受限迁移"`，按内置迁移矩阵校验，不合法迁移告警 `E4304`

## 单元测试覆盖

当前已包含：
- 双解析器 AST 等价性（happy-path）
- 结构/引用规则命中（`E2202`）
- 生成文本规则命中（`E3004/E3007/E3009`）
- 扩展标签前向兼容（未知标签不破坏校验）

规则到样例/测试映射见：
- [rule-coverage.md](/Users/d-robotics/lab/nml/validator/docs/rule-coverage.md)

## Tree-sitter note for Chinese tags
`tree-sitter-xml` grammar is ASCII-oriented for element/attribute names.

Current adapter strategy:
1. Normalize Chinese tag/attr names to stable ASCII aliases.
2. Parse with Tree-sitter for syntax validation.
3. Build AST via XML adapter on normalized text.
4. De-normalize aliases back to original Chinese names.

Custom NML grammar prototype lives in `tree-sitter-nml/`.
