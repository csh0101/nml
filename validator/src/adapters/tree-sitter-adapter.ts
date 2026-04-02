import Parser from "tree-sitter";
import grammarModule from "@tree-sitter-grammars/tree-sitter-xml";
import type { NmlDocument } from "../types/ast.js";
import type { ParserAdapter } from "./parser-adapter.js";
import { XmlAdapter } from "./xml-adapter.js";

interface NameMaps {
  tagForward: Map<string, string>;
  tagBackward: Map<string, string>;
  attrForward: Map<string, string>;
  attrBackward: Map<string, string>;
}

function getTagAlias(original: string, maps: NameMaps): string {
  const cached = maps.tagForward.get(original);
  if (cached) return cached;
  const alias = `nml_tag_${maps.tagForward.size}`;
  maps.tagForward.set(original, alias);
  maps.tagBackward.set(alias, original);
  return alias;
}

function getAttrAlias(original: string, maps: NameMaps): string {
  const cached = maps.attrForward.get(original);
  if (cached) return cached;
  const alias = `nml_attr_${maps.attrForward.size}`;
  maps.attrForward.set(original, alias);
  maps.attrBackward.set(alias, original);
  return alias;
}

function normalizeTag(rawTag: string, maps: NameMaps): string {
  if (rawTag.startsWith("<?") || rawTag.startsWith("<!")) return rawTag;

  const open = rawTag.startsWith("<") ? "<" : "";
  const close = rawTag.endsWith(">") ? ">" : "";
  let body = rawTag.slice(open.length, rawTag.length - close.length);

  const isClosing = body.startsWith("/");
  if (isClosing) body = body.slice(1);

  const selfClosing = body.endsWith("/");
  if (selfClosing) body = body.slice(0, -1);

  body = body.trim();
  if (!body) return rawTag;

  const nameMatch = body.match(/^([^\s/>]+)([\s\S]*)$/);
  if (!nameMatch) return rawTag;

  const originalName = nameMatch[1]!;
  const rest = nameMatch[2] ?? "";

  const nameAlias = getTagAlias(originalName, maps);

  const replacedRest = rest.replace(/([^\s=/>]+)\s*=\s*("[^"]*"|'[^']*')/g, (_m, attrName: string, attrValue: string) => {
    const attrAlias = getAttrAlias(attrName, maps);
    return `${attrAlias}=${attrValue}`;
  });

  const start = isClosing ? `</${nameAlias}` : `<${nameAlias}`;
  const end = selfClosing ? "/>" : ">";
  return `${start}${replacedRest}${end}`;
}

function normalizeXml(content: string): { normalized: string; maps: NameMaps } {
  const maps: NameMaps = {
    tagForward: new Map(),
    tagBackward: new Map(),
    attrForward: new Map(),
    attrBackward: new Map(),
  };

  const normalized = content.replace(/<[^>]+>/g, (tag) => normalizeTag(tag, maps));
  return { normalized, maps };
}

function denormalizeDocument(doc: NmlDocument, maps: NameMaps): NmlDocument {
  function denormAttrName(name: string): string {
    return maps.attrBackward.get(name) ?? name;
  }

  function denormTagName(name: string): string {
    return maps.tagBackward.get(name) ?? name;
  }

  function denormNode(node: NmlDocument["root"]): NmlDocument["root"] {
    const attrs: Record<string, string> = {};
    for (const [k, v] of Object.entries(node.attributes)) {
      attrs[denormAttrName(k)] = v;
    }

    return {
      tag: denormTagName(node.tag),
      attributes: attrs,
      text: node.text,
      children: node.children.map(denormNode),
    };
  }

  return {
    ...doc,
    root: denormNode(doc.root),
  };
}

export class TreeSitterAdapter implements ParserAdapter {
  private parser: Parser;
  private xmlAdapter: XmlAdapter;

  constructor() {
    this.parser = new Parser();
    const language = (grammarModule as { xml?: unknown })?.xml ?? grammarModule;
    this.parser.setLanguage(language as never);
    this.xmlAdapter = new XmlAdapter();
  }

  parse(content: string, filePath?: string): NmlDocument {
    const { normalized, maps } = normalizeXml(content);

    const tree = this.parser.parse(normalized);
    if (tree.rootNode.hasError) {
      throw new Error("Tree-sitter parse failed for NML/XML content");
    }

    const normalizedDoc = this.xmlAdapter.parse(normalized, filePath);
    return denormalizeDocument(normalizedDoc, maps);
  }
}
