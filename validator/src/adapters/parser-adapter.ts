import type { NmlDocument } from "../types/ast.js";

export interface ParserAdapter {
  parse(content: string, filePath?: string): NmlDocument;
}
