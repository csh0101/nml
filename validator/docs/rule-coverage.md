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
| E1210 | Covered | `tests/validator-core.test.ts` |
| E1301 | Covered | `src/samples/regression/fp_025_scene_missing_id.expect.json` |
| E1302 | Covered | `src/samples/regression/fp_026_scene_missing_location_attr.expect.json` |
| E1303 | Covered | `src/samples/regression/fp_018_scene_without_task.expect.json` |
| E1304 | Covered | `src/samples/regression/fp_019_task_without_target.expect.json` |
| E1311 | Covered | `src/samples/regression/fp_034_segment_missing_word_target.expect.json` |
| E1312 | Covered | `src/samples/regression/fp_035_segment_invalid_word_target.expect.json`, `tests/validator-core.test.ts` |
| E1313 | Covered | `src/samples/regression/fp_036_segment_missing_function.expect.json` |
| E1314 | Covered | `src/samples/regression/fp_037_segment_invalid_function.expect.json`, `tests/validator-core.test.ts` |
| E1315 | Covered | `src/samples/regression/fp_038_segment_missing_focus.expect.json` |
| E1316 | Covered | `src/samples/regression/fp_039_segment_invalid_focus.expect.json`, `tests/validator-core.test.ts` |
| E1317 | Covered | `src/samples/regression/fp_040_segment_missing_pace.expect.json` |
| E1318 | Covered | `src/samples/regression/fp_041_segment_invalid_pace.expect.json`, `tests/validator-core.test.ts` |
| E1319 | Covered | `src/samples/regression/fp_042_segment_missing_info_point.expect.json`, `tests/validator-core.test.ts` |
| E1320 | Covered | `src/samples/regression/fp_043_info_point_missing_type.expect.json` |
| E1321 | Covered | `src/samples/regression/fp_044_info_point_invalid_type.expect.json` |
| E1322 | Covered | `src/samples/regression/fp_045_info_point_missing_weight.expect.json`, `tests/validator-core.test.ts` |
| E1323 | Covered | `src/samples/regression/fp_046_info_point_invalid_weight.expect.json`, `tests/validator-core.test.ts` |
| E1330 | Covered | `src/samples/regression/fp_052_segment_ratio_align_missing_dialogue.expect.json` |
| E1331 | Covered | `src/samples/regression/fp_053_segment_ratio_align_invalid_dialogue.expect.json`, `tests/validator-core.test.ts` |
| E1332 | Covered | `src/samples/regression/fp_054_segment_ratio_align_missing_action.expect.json` |
| E1333 | Covered | `src/samples/regression/fp_055_segment_ratio_align_invalid_action.expect.json` |
| E1340 | Covered | `src/samples/regression/fp_062_state_missing_role.expect.json`, `tests/validator-core.test.ts` |
| E1341 | Covered | `src/samples/regression/fp_063_state_missing_phase.expect.json` |
| E1342 | Covered | `src/samples/regression/fp_064_state_invalid_phase.expect.json`, `tests/validator-core.test.ts` |
| E1343 | Covered | `src/samples/regression/fp_068_state_invalid_stamina_value.expect.json`, `tests/validator-core.test.ts` |
| E1344 | Covered | `src/samples/regression/fp_069_state_invalid_mood_value.expect.json`, `tests/validator-core.test.ts` |
| E1350 | Covered | `src/samples/regression/fp_071_relation_missing_role.expect.json` |
| E1351 | Covered | `tests/validator-core.test.ts` |
| E1352 | Covered | `tests/validator-core.test.ts` |
| E1353 | Covered | `tests/validator-core.test.ts` |
| E1354 | Covered | `tests/validator-core.test.ts` |
| E1355 | Covered | `src/samples/regression/fp_072_relation_invalid_strength.expect.json`, `tests/validator-core.test.ts` |
| E1356 | Covered | `src/samples/regression/fp_076_relation_type_invalid_value.expect.json`, `tests/validator-core.test.ts` |
| E1357 | Covered | `src/samples/regression/fp_079_relation_type_mode_missing_type.expect.json`, `tests/validator-core.test.ts` |
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
| E2210 | Covered | `src/samples/regression/fp_048_segment_pov_missing_ref_warning.expect.json`, `tests/validator-core.test.ts` |
| E2211 | Covered | `src/samples/regression/fp_049_segment_effective_pov_missing_warning.expect.json`, `tests/validator-core.test.ts` |
| E2212 | Covered | `src/samples/regression/fp_065_state_role_missing_ref_warning.expect.json`, `tests/validator-core.test.ts` |
| E2213 | Covered | `src/samples/regression/fp_073_relation_role_ref_warning.expect.json`, `tests/validator-core.test.ts` |
| E2214 | Covered | `src/samples/regression/fp_073_relation_role_ref_warning.expect.json` |
| E3004 | Covered | `src/samples/regression/fp_008_generated_text_fail.expect.json`, `tests/validator-core.test.ts` |
| E3007 | Covered | `src/samples/regression/fp_008_generated_text_fail.expect.json`, `tests/validator-core.test.ts` |
| E3009 | Covered | `tests/validator-core.test.ts` |
| E3102 | Covered | `src/samples/regression/fp_002_info_overlap.expect.json` |
| E3201 | Covered | `src/samples/regression/fp_013_ratio_non_numeric.expect.json` |
| E3202 | Covered | `src/samples/regression/fp_003_ratio_sum.expect.json` |
| E3301 | Covered | `src/samples/regression/fp_047_scene_segment_word_sum_mismatch.expect.json`, `tests/validator-core.test.ts` |
| E3302 | Covered | `src/samples/regression/fp_050_segment_ratio_align_invalid_threshold.expect.json` |
| E3303 | Covered | `src/samples/regression/fp_051_segment_ratio_align_missing_scene_ratio.expect.json` |
| E3304 | Covered | `src/samples/regression/fp_056_segment_ratio_align_dialogue_deviation.expect.json` |
| E3305 | Covered | `src/samples/regression/fp_057_segment_ratio_align_action_deviation.expect.json`, `tests/validator-core.test.ts` |
| E4101 | Covered | `src/samples/regression/fp_058_segment_function_reverse_warning.expect.json`, `tests/validator-core.test.ts` |
| E4102 | Covered | `src/samples/regression/fp_059_segment_function_bad_start_warning.expect.json`, `tests/validator-core.test.ts` |
| E4103 | Covered | `src/samples/regression/fp_060_segment_function_bad_end_warning.expect.json`, `tests/validator-core.test.ts` |
| E4104 | Covered | `src/samples/regression/fp_061_fast_scene_too_many_fallback_warning.expect.json`, `tests/validator-core.test.ts` |
| E4201 | Covered | `src/samples/regression/fp_066_state_continuity_mismatch_warning.expect.json`, `tests/validator-core.test.ts` |
| E4202 | Covered | `src/samples/regression/fp_066_state_continuity_mismatch_warning.expect.json`, `tests/validator-core.test.ts` |
| E4203 | Covered | `src/samples/regression/fp_067_state_stamina_evolution_rise_warning.expect.json`, `tests/validator-core.test.ts` |
| E4204 | Covered | `src/samples/regression/fp_070_state_mood_evolution_illegal_warning.expect.json`, `tests/validator-core.test.ts` |
| E4301 | Covered | `src/samples/regression/fp_074_relation_continuity_mismatch_warning.expect.json` |
| E4302 | Covered | `src/samples/regression/fp_075_relation_evolution_exceed_warning.expect.json`, `tests/validator-core.test.ts` |
| E4303 | Covered | `src/samples/regression/fp_077_relation_type_strict_mismatch_warning.expect.json` |
| E4304 | Covered | `src/samples/regression/fp_078_relation_type_illegal_transition_warning.expect.json`, `tests/validator-core.test.ts` |

## Not Covered Yet

当前校验器中的已实现规则码，已全部有 regression 或单测命中。

## Evolution Rule (Required)

每次新增或修改 NML 规则，必须同时提交：

1. 一个 `hp_*`（合法样例）
2. 一个 `fp_*`（非法样例，命中目标规则码）
3. 对应 `*.expect.json`
4. 若涉及 parser 行为变化，再补 `tests/validator-core.test.ts` 的解析/AST 断言

否则不允许合并。
