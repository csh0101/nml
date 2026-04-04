import type { ParserAdapter } from "../adapters/parser-adapter.js";
import { XmlAdapter } from "../adapters/xml-adapter.js";
import { TreeSitterAdapter } from "../adapters/tree-sitter-adapter.js";
import { RustNomAdapter } from "../adapters/rust-nom-adapter.js";

export type ParserKind = "xml" | "tree-sitter" | "rust-nom";

export function parseCliArgs(argv: string[]): { parser: ParserKind; fileArg?: string } {
  let parser: ParserKind = "xml";
  let fileArg: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token.startsWith("--parser=")) {
      const value = token.slice("--parser=".length) as ParserKind;
      parser = value;
      continue;
    }

    if (token === "--parser") {
      const value = argv[i + 1] as ParserKind | undefined;
      if (value) {
        parser = value;
        i += 1;
      }
      continue;
    }

    if (!token.startsWith("--") && !fileArg) {
      fileArg = token;
    }
  }

  return { parser, fileArg };
}

export function createParserAdapter(kind: ParserKind): ParserAdapter {
  if (kind === "xml") return new XmlAdapter();
  if (kind === "tree-sitter") return new TreeSitterAdapter();
  if (kind === "rust-nom") return new RustNomAdapter();
  throw new Error(`Unsupported parser kind: ${kind}`);
}
