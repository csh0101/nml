# Parser Adapters

Current:
- `XmlAdapter`: production-ready MVP parser based on `fast-xml-parser`.

Planned:
- `TreeSitterAdapter`: keep `ParserAdapter` interface and return the same `NmlDocument` AST shape.

Migration path:
1. Implement `TreeSitterAdapter.parse()`.
2. Replace adapter creation in CLI/runtime config.
3. Keep validator core unchanged.
