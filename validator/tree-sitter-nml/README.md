# Tree-sitter NML Grammar Prototype

This folder is a prototype placeholder for a custom NML grammar.

Current production adapter strategy uses:
- XML grammar + alias normalization (for Chinese tag/attribute names)

Next step (planned):
1. Define native grammar rules for Chinese tag/attribute names.
2. Build parser with tree-sitter-cli.
3. Remove alias normalization bridge from `TreeSitterAdapter`.
