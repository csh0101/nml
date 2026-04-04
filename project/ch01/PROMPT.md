# NML 写作执行助手工作流

## 项目路径
- NML 工程根目录：`/Users/d-robotics/lab/nml`
- 校验器目录：`/Users/d-robotics/lab/nml/validator`
- 本章工作目录：`/Users/d-robotics/lab/nml/project/ch01`

## 目标
- 产出"第1章"蓝图 NML + 正文 txt
- 通过 nml_check 自动验收
- 不通过就自动修复，直到通过或给出明确失败原因

## 硬性要求
1. 文风：中文网文，语言简练，句子短中结合，避免拖沓和空泛抒情。
2. 章节字数目标：3000 字（允许 ±10%）。
3. 必须可追踪：每次修改后都重新调用 nml_check。
4. 所有文件都写入本地，不只在对话里展示。

---

## 阶段 A：初始化与设定检查

执行：
1. 检查并创建目录：`/Users/d-robotics/lab/nml/project/ch01`
2. 如果不存在则创建 3 个文件：
   - chapter01.nml
   - chapter01.generated.txt
   - notes.md
3. 在 notes.md 写入：
   - 本章目标
   - 主角状态
   - 反派状态
   - 章节钩子

完成后汇报"阶段A完成"。

---

## 阶段 B：生成 NML 蓝图（MVP+增强标签）

生成 chapter01.nml，要求至少包含这些结构：

- `<设定集>`
  - 至少 2 个角色（主角、敌首）
  - 至少 2 个地点（荒庙、庙后山道）

- `<正文>`
  - `<章节 序号="1" 标题="残阳如血">`
    - `<章节蓝图 字数目标="3000" 章节目标="..." 章节钩子="..."/>`
    - 3 个 `<场景>`（s1/s2/s3），每个场景必须有：
      - 字数目标
      - 节奏
      - 氛围
      - 视角角色
      - `<任务>`
      - `<配比 描写=".." 对话=".." 动作=".."/>`
      - `<信息揭示 必须提及="..." 禁止提及="..."/>`
      - >=3 个 `<拍点>`
      - `<场景收束>`

风格约束（写入 NML 的可读标签）：
- 每个场景加：`<文风约束 句长="短中句为主" 密度="高信息密度" 修辞="克制" 禁止="堆砌辞藻,连续排比,空泛抒情"/>`

完成后，调用 nml_check 校验该 NML：
- parser=tree-sitter
- file=/Users/d-robotics/lab/nml/project/ch01/chapter01.nml

如果失败，按 issues 自动修复并重跑，直到通过。
完成后汇报"阶段B完成 + 校验通过"。

---

## 阶段 C：按蓝图生成正文

基于 chapter01.nml 生成 chapter01.generated.txt，要求：
1. 总字数目标 3000（允许 ±10%）。
2. 严格按 s1 -> s2 -> s3 顺序推进。
3. 不得泄露被"禁止提及"的信息。
4. 对话服务冲突，不要灌水。
5. 每段尽量有新信息或状态变化。

生成后，调用 nml_check 进行语义验收：
- file=/Users/d-robotics/lab/nml/project/ch01/chapter01.nml
- parser=tree-sitter
- generatedTextFile=/Users/d-robotics/lab/nml/project/ch01/chapter01.generated.txt
- reportOutFile=/Users/d-robotics/lab/nml/project/ch01/chapter01.report.json

若出现 E3004/E3007/E3009：
- 自动定点改写 chapter01.generated.txt
- 再次调用 nml_check
- 循环直到通过或你确认规则冲突无法同时满足

完成后汇报"阶段C完成 + 语义验收结果"。

---

## 阶段 D：交付与总结

最终输出：
1. 产物清单（绝对路径）：
   - chapter01.nml
   - chapter01.generated.txt
   - chapter01.report.json
   - notes.md
2. 最终校验结论（passed/failed）
3. 若 failed，列出剩余 issues（按严重度排序）
4. 给出下一章衔接建议（3条以内，务实可执行）
