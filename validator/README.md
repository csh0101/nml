# NML Validator (MVP)

Current stack:
- TypeScript + Node.js
- XML parser adapter: `fast-xml-parser`
- Tree-sitter adapter: `tree-sitter` + `@tree-sitter-grammars/tree-sitter-xml`
- MCP server: `nml_check`, `nml_regress`

## Commands

```bash
cd validator
npm install

# XML adapter
npm run check -- src/samples/happy-path.nml --parser xml

# Tree-sitter adapter
npm run check -- src/samples/happy-path.nml --parser tree-sitter

# Inspect AST and tag statistics
npm run inspect -- src/samples/happy-path.nml --parser tree-sitter --ast-json-out reports/happy.ast.json

# Regression suite (supports generated-text expectations via .expect.json)
npm run regress -- --parser xml
npm run regress -- --parser tree-sitter

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
