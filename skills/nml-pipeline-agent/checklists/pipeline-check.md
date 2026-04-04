# Pipeline 自检清单

1. `nml_check` 是否 passed=true（结构/引用/规则）。
2. `compile` 是否成功产出 `prompt-ir.json`。
3. `render` 是否成功产出 `prompt.txt`。
4. 生成正文后，是否执行了 `--generated-text` 验收。
5. 若失败，是否按 issues 回写并重试（最多 3 次）。
6. 最终是否输出校验摘要与产物路径。
