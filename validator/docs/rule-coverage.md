# Rule Coverage Matrix

本文档用于追踪每个规则码是否有自动化覆盖，避免 DSL 演进时出现“规则改了但没人知道”。

## Covered Now

| Rule Code | Status | Coverage Source |
|---|---|---|
| E1001 | Covered | `src/samples/regression/fp_009_invalid_root_tag.expect.json` |
| E1002 | Covered | `src/samples/regression/fp_010_missing_project_name.expect.json` |
| E1003 | Covered | `src/samples/regression/fp_011_missing_project_version.expect.json` |
| E1101 | Covered | `src/samples/regression/fp_014_missing_metadata.expect.json` |
| E1102 | Covered | `src/samples/regression/fp_015_no_chapter_in_body.expect.json` |
| E1201 | Covered | `src/samples/regression/fp_016_missing_chapter_order.expect.json` |
| E1202 | Covered | `src/samples/regression/fp_017_missing_chapter_title.expect.json` |
| E1203 | Covered | `src/samples/regression/fp_021_chapter_without_scene.expect.json` |
| E1204 | Covered | `src/samples/regression/fp_022_invalid_pov_enum.expect.json` |
| E1205 | Covered | `src/samples/regression/fp_006_invalid_percent_format.expect.json` |
| E1206 | Covered | `src/samples/regression/fp_004_invalid_pace_enum.expect.json` |
| E1207 | Covered | `src/samples/regression/fp_007_invalid_range_format.expect.json` |
| E1208 | Covered | `src/samples/regression/fp_023_invalid_long_sentence_ratio.expect.json` |
| E1209 | Covered | `src/samples/regression/fp_024_invalid_ending_type.expect.json` |
| E1301 | Covered | `src/samples/regression/fp_025_scene_missing_id.expect.json` |
| E1302 | Covered | `src/samples/regression/fp_026_scene_missing_location_attr.expect.json` |
| E1303 | Covered | `src/samples/regression/fp_018_scene_without_task.expect.json` |
| E1304 | Covered | `src/samples/regression/fp_019_task_without_target.expect.json` |
| E1401 | Covered | `src/samples/regression/fp_027_role_missing_id.expect.json` |
| E1402 | Covered | `src/samples/regression/fp_028_location_missing_id.expect.json` |
| E1403 | Covered | `src/samples/regression/fp_029_style_template_missing_id.expect.json` |
| E2101 | Covered | `src/samples/regression/fp_030_duplicate_role_id.expect.json` |
| E2102 | Covered | `src/samples/regression/fp_031_duplicate_location_id.expect.json` |
| E2103 | Covered | `src/samples/regression/fp_032_duplicate_style_template_id.expect.json` |
| E2104 | Covered | `src/samples/regression/fp_005_duplicate_scene_id_local.expect.json` |
| E2105 | Covered | `src/samples/regression/fp_033_duplicate_segment_index_local.expect.json` |
| E2201 | Covered | `src/samples/regression/fp_020_missing_role_ref_warning.expect.json` |
| E2202 | Covered | `src/samples/regression/fp_001_missing_location_ref.expect.json`, `tests/validator-core.test.ts` |
| E2203 | Covered | `src/samples/regression/fp_012_missing_style_template_ref.expect.json` |
| E3004 | Covered | `src/samples/regression/fp_008_generated_text_fail.expect.json`, `tests/validator-core.test.ts` |
| E3007 | Covered | `src/samples/regression/fp_008_generated_text_fail.expect.json`, `tests/validator-core.test.ts` |
| E3009 | Covered | `tests/validator-core.test.ts` |
| E3102 | Covered | `src/samples/regression/fp_002_info_overlap.expect.json` |
| E3201 | Covered | `src/samples/regression/fp_013_ratio_non_numeric.expect.json` |
| E3202 | Covered | `src/samples/regression/fp_003_ratio_sum.expect.json` |

## Not Covered Yet

当前校验器中的已实现规则码，已全部有 regression 或单测命中。

## Evolution Rule (Required)

每次新增或修改 NML 规则，必须同时提交：

1. 一个 `hp_*`（合法样例）
2. 一个 `fp_*`（非法样例，命中目标规则码）
3. 对应 `*.expect.json`
4. 若涉及 parser 行为变化，再补 `tests/validator-core.test.ts` 的解析/AST 断言

否则不允许合并。
