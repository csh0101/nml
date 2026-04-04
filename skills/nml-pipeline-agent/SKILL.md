# NML Pipeline Agent Skill

## 目标
让 Agent 以可回归的流水线完成章节生产：
1. NML 校验
2. 编译 Prompt IR
3. 渲染最终 Prompt
4. 生成正文
5. 验收与重试

## 输入
- NML 文件绝对路径（例：`/Users/d-robotics/lab/nml/project/ch01/chapter01.nml`）
- 目标模型：`claude` 或 `openai`
- 正文输出路径（例：`project/ch01/chapter01.generated.txt`）

## 强制步骤
1. 结构校验（必须通过）
   - `cd /Users/d-robotics/lab/nml/validator`
   - `npm run check -- <chapter.nml> --parser tree-sitter`
   - 可选：`npm run check -- <chapter.nml> --parser rust-nom`

2. 编译 Prompt IR
   - `npm run compile -- <chapter.nml> --parser tree-sitter --out reports/ch.prompt-ir.json`

3. 渲染最终 Prompt
   - `npm run render -- reports/ch.prompt-ir.json --model <claude|openai> --out reports/ch.prompt.txt`

4. 调用 LLM 生成正文
   - 输入：`reports/ch.prompt.txt`
   - 输出：目标正文文件

5. 正文验收（语义校验）
   - `npm run check -- <chapter.nml> --parser tree-sitter --generated-text <generated.txt>`
   - 若失败：根据 `issues.code/path/message` 回写 NML 或重写正文，重复步骤 2-5。

## 重试策略
- 最多 3 轮。
- 若仍失败：输出失败摘要（错误码聚合 + 首要冲突项）。

## 输出要求
- 最终正文
- 最后一次校验摘要：`passed/errorCodes/warningCodes`
- 若失败，附 `reports/ch.prompt-ir.json` 与 `reports/ch.prompt.txt`

## 附件
- 命令模板：`templates/runbook.md`
- 自检清单：`checklists/pipeline-check.md`
- Agent 执行提示词：`prompts/agent-pipeline-prompt.txt`
