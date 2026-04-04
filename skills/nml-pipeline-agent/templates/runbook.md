# Runbook

假设：
- NML: `/Users/d-robotics/lab/nml/project/ch01/chapter01.nml`
- 正文: `/Users/d-robotics/lab/nml/project/ch01/chapter01.generated.txt`

```bash
cd /Users/d-robotics/lab/nml/validator

# 1) 先校验 NML
npm run check -- /Users/d-robotics/lab/nml/project/ch01/chapter01.nml --parser tree-sitter

# 2) 编译 IR
npm run compile -- /Users/d-robotics/lab/nml/project/ch01/chapter01.nml --parser tree-sitter --out reports/ch01.prompt-ir.json

# 3) 渲染 Prompt
npm run render -- reports/ch01.prompt-ir.json --model claude --out reports/ch01.prompt.txt

# 4) 用 reports/ch01.prompt.txt 调模型生成正文（由 Agent 执行）

# 5) 正文验收
npm run check -- /Users/d-robotics/lab/nml/project/ch01/chapter01.nml \
  --parser tree-sitter \
  --generated-text /Users/d-robotics/lab/nml/project/ch01/chapter01.generated.txt
```
