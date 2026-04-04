# nml

## Git Pre-commit Hook

Install once per clone:

```bash
./scripts/install-hooks.sh
```

After installation, every `git commit` runs:

```bash
cd validator
npm run unittest
```

`unittest` includes:
- `npm run test`
- `npm run regress -- --parser tree-sitter`
- `npm run regress -- --parser xml`

## Rust Parser Prototype (`parser-rs`)

`parser-rs/` is a parallel Rust + `nom` parser prototype that converts NML to AST JSON.

Quick start:

```bash
cd parser-rs
cargo test
cargo run -- ../project/ch01/chapter01.nml --pretty
```

## Agent Skill: NML Authoring

Skill path:
- `skills/nml-authoring/SKILL.md`
- `skills/nml-chapter-3000/SKILL.md`
- `skills/nml-pipeline-agent/SKILL.md`

What it provides:
- NML chapter template
- self-check checklist
- validator-driven repair loop (`nml_check` / `npm run check`)
