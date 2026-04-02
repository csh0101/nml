# NML Standard v2.1

Status: Draft
Version: 2.1

## 1. Scope
NML (Novel Markup Language) is a structured markup specification for novel production planning and agent-driven scene generation.

Goals:
- Human-readable authoring
- Machine-validated structure
- Agent-executable constraints
- Repeatable quality gates

## 2. Conformance Language
- MUST: mandatory requirement
- SHOULD: recommended requirement
- MAY: optional behavior

## 3. Core Model
NML document MUST have exactly one root tag: `小说项目`.

Core layers:
- Metadata layer (`元数据`, `写作准则`, `风格库`)
- Lore layer (`设定集`, `角色`, `地点`)
- Narrative layer (`正文`, `章节`, `场景`)
- Validation layer (`验收规则`, `硬性失败`)

## 4. Syntax Contract (Minimal)
### 4.1 Root
`小说项目` MUST include:
- `名称` (string)
- `版本` (string)

### 4.2 Required hierarchy
- `小说项目/元数据` MUST exist.
- If `正文` exists, it MUST contain at least one `章节`.
- Each `章节` MUST contain at least one `场景`.
- Each `场景` MUST contain exactly one `任务`.

### 4.3 References
- `场景.地点引用` MUST resolve to `地点.id`.
- `章节.风格模板引用` (if provided) MUST resolve to `风格模板.id`.
- `场景.视角角色` SHOULD resolve to `角色.id`.

## 5. Attribute Types
The implementation MUST support:
- `int`
- `percent` (e.g., `8%`)
- `range` (e.g., `10-16`)
- `enum`
- `csv<string>`
- `bool` (`true|false`)
- `string`

Invalid type format MUST fail validation.

## 6. Semantic Precedence
When conflicts occur, processing order MUST be:
1. Security/forbidden constraints (`禁止提及`, hard failures)
2. Global rules (`写作准则`)
3. Style template constraints (`风格模板` children)
4. Scene-level constraints (`场景` attributes)
5. Task goal (`任务`)
6. Paragraph-level hints (`段落计划`, `段`)
7. Free text hints

## 7. Scene Execution Protocol
A runner MUST process one scene at a time.

Required steps:
1. Load required context
2. Validate structure and references
3. Build effective constraints
4. Generate scene text
5. Run acceptance checks
6. Retry on fixable failures

## 8. Acceptance Rules
`验收规则/硬性失败` define blocking failures.

At minimum, implementation SHOULD support checks for:
- Missing required info
- Forbidden info presence
- Sentence length overflow
- Ending target miss (`场景收束.落点`)

## 9. Error Codes
Recommended classes:
- `E1xxx`: structure
- `E2xxx`: reference
- `E3xxx`: rule/validation
- `E4xxx`: runtime/import
- `E5xxx`: version/migration
- `E6xxx`: extension

## 10. Import and Modularity
If import is enabled (`导入`):
- Import graph MUST be acyclic.
- Circular import MUST fail.
- Duplicate global IDs after expansion MUST fail.

## 11. Versioning and Migration
Root `版本` declaration is REQUIRED.

Compatibility policy:
- Minor updates MUST be backward compatible.
- Major updates MAY break compatibility but MUST provide migration guidance.

## 12. Extension Mechanism
Extension tags SHOULD be namespaced/prefixed (e.g., `扩展:*`).

Unknown extension tags MAY be ignored with warning, unless explicitly declared required.

## 13. Minimal Example
```xml
<小说项目 名称="剑起大荒" 版本="2.1-M1">
  <元数据>
    <写作准则 文风="冷峻简练" 视角="第三人称限定" 细节度="3"/>
  </元数据>
  <设定集>
    <角色 id="char_lin_xun" 姓名="林寻"/>
    <地点 id="loc_broken_temple" 名称="荒庙"/>
  </设定集>
  <正文>
    <章节 序号="1" 标题="残阳如血">
      <场景 id="s1" 地点引用="loc_broken_temple">
        <任务 目标="绝境决断并破门收束"/>
      </场景>
    </章节>
  </正文>
</小说项目>
```

## 14. Appendix Index
- Tag contract details: `docs/NML定义/标签/`
- Explanatory volumes: `docs/NML定义/讲解/`

