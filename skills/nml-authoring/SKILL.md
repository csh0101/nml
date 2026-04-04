# NML Authoring Skill

## 目标
让 Agent 生成“可通过校验器”的 NML 文件，并能自动修复失败项。

## 适用场景
- 新建章节蓝图（`<章节>/<场景>/<段落计划>`）
- 修改既有 NML 后做结构/引用/规则自检
- 生成正文前先保证 NML 合法

## 输入
- 目标文件路径（例如：`/Users/d-robotics/lab/nml/project/ch01/chapter01.nml`）
- 章节目标与剧情约束
- 可选：风格约束（简练、推进优先）

## 执行流程
1. 先按模板组织结构：`小说项目 -> 元数据/设定集/正文 -> 章节 -> 场景 -> 段落计划 -> 段`。
2. 写完后立刻运行校验：
   - `cd /Users/d-robotics/lab/nml/validator`
   - `npm run check -- <file.nml> --parser tree-sitter`
3. 若失败，按 `issues[].code + issues[].path + issues[].message` 逐项修复。
4. 修复后再次校验，直到 `passed=true`。
5. 可选再跑一次：`--parser rust-nom` 做双解析器一致性校验。

## 强制约束
- 每个 `<场景>` 必须恰好一个 `<任务>`。
- `地点引用` 必须命中 `<地点 id>`。
- `<段>` 必须有：`字数目标/功能/焦点/节奏`。
- 每个 `<段>` 至少 1 个 `<信息点 类型="..." 权重="...">`。
- 若启用 `关系类型演化`，所有 `<关系状态>` 必须带 `类型`。

## 常用命令
- 单文件检查：
  - `npm run check -- <file.nml> --parser tree-sitter`
- 双解析器检查：
  - `npm run check -- <file.nml> --parser tree-sitter`
  - `npm run check -- <file.nml> --parser rust-nom`
- 全量回归：
  - `npm run unittest:all`

## 输出要求
- 输出 NML 文件必须可通过校验（`passed=true`）。
- 输出时附带最后一次校验结果摘要（passed/errorCodes/warningCodes）。

## 模板
- 章节模板：`templates/chapter-template.nml`
- 自检清单：`checklists/nml-self-check.md`
