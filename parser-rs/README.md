# parser-rs (nom prototype)

Rust prototype parser for NML (Novel Markup Language), built with `nom`.

Current goal (MVP):
- Parse NML/XML-like source
- Output normalized AST JSON compatible with existing validator shape

## Build

```bash
cd parser-rs
cargo build
```

## Test

```bash
cd parser-rs
cargo test
```

## Run

```bash
cd parser-rs
cargo run -- ../project/ch01/chapter01.nml --pretty
```

Output shape:
- `{"root": AstNode}`
- `AstNode`: `{ tag, attributes, text?, children[] }`

## Scope Notes

- This is a parallel parser core and does not replace the TypeScript validator yet.
- Next integration step is to let TS check CLI optionally consume this AST JSON.
