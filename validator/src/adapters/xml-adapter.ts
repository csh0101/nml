import { XMLParser } from "fast-xml-parser";
import type { AstNode, NmlDocument } from "../types/ast.js";
import type { ParserAdapter } from "./parser-adapter.js";

const ATTR_PREFIX = "@_";
const TEXT_KEY = "#text";

export class XmlAdapter implements ParserAdapter {
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ATTR_PREFIX,
    textNodeName: TEXT_KEY,
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
  });

  parse(content: string, filePath?: string): NmlDocument {
    const parsed = this.parser.parse(content) as Record<string, unknown>;
    const keys = Object.keys(parsed);
    if (keys.length !== 1) {
      throw new Error("XML must contain exactly one root element");
    }

    const rootKey = keys[0]!;
    const rootValue = parsed[rootKey];
    const root = this.toNode(rootKey, rootValue);
    return { root, filePath };
  }

  private toNode(tag: string, value: unknown): AstNode {
    if (typeof value === "string") {
      return { tag, attributes: {}, text: value, children: [] };
    }

    if (!value || typeof value !== "object") {
      return { tag, attributes: {}, children: [] };
    }

    const obj = value as Record<string, unknown>;
    const attributes: Record<string, string> = {};
    const children: AstNode[] = [];
    let text: string | undefined;

    for (const [key, raw] of Object.entries(obj)) {
      if (key.startsWith(ATTR_PREFIX)) {
        attributes[key.slice(ATTR_PREFIX.length)] = String(raw ?? "");
        continue;
      }

      if (key === TEXT_KEY) {
        text = String(raw ?? "").trim();
        continue;
      }

      if (Array.isArray(raw)) {
        for (const item of raw) {
          children.push(this.toNode(key, item));
        }
        continue;
      }

      children.push(this.toNode(key, raw));
    }

    return { tag, attributes, text, children };
  }
}
