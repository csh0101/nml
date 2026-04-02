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
