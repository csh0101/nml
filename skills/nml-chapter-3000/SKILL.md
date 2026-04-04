# NML Chapter 3000 Skill

## 目标
为单章生成“可通过校验”的 3000 字 NML 蓝图，并驱动 Agent 产出正文。

## 产出
- 一个章节级 NML（推荐 3 场景，约 900/1200/900）
- 一版章节正文（约 3000 字）
- 校验结果摘要（passed/errorCodes/warningCodes）

## 输入
- 文件路径（例如：`/Users/d-robotics/lab/nml/project/ch01/chapter01.nml`）
- 章节目标（一句话）
- 章节钩子（一句话）
- 主视角角色 id

## 执行流程
1. 先用 `templates/chapter-3000-blueprint.nml` 填充章节信息。
2. 确保 3 个场景字数目标总和 = 3000。
3. 每个场景都写 `任务/信息揭示/段落计划/场景收束`。
4. 每个 `段` 至少 1 个 `信息点`，并补齐 `字数目标/功能/焦点/节奏`。
5. 运行校验：
   - `cd /Users/d-robotics/lab/nml/validator`
   - `npm run check -- <file.nml> --parser tree-sitter`
6. 若失败，按 issue 修复后重复第 5 步，直到 `passed=true`。
7. 可选再跑一次：`npm run check -- <file.nml> --parser rust-nom`。

## 分段建议
- 场景1（900）：铺垫与围压建立
- 场景2（1200）：冲突升级与关键触发
- 场景3（900）：后果落地与章节钩子

## 风格约束（默认）
- 简练，推进优先
- 避免重复意象与空泛抒情
- 对话服务冲突，不复述已知信息

## 命令
- 单文件校验：
  - `npm run check -- <file.nml> --parser tree-sitter`
- 双解析器校验：
  - `npm run check -- <file.nml> --parser tree-sitter`
  - `npm run check -- <file.nml> --parser rust-nom`
- 全量回归：
  - `npm run unittest:all`

## 附件
- 模板：`templates/chapter-3000-blueprint.nml`
- 清单：`checklists/chapter-3000-check.md`
- 提示词：`prompts/agent-prompt.txt`
