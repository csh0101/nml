import type { AstNode } from "../types/ast.js";

export function childrenOf(node: AstNode, tag: string): AstNode[] {
  return node.children.filter((child) => child.tag === tag);
}

export function firstChild(node: AstNode, tag: string): AstNode | undefined {
  return node.children.find((child) => child.tag === tag);
}

export function walk(node: AstNode, visit: (node: AstNode, path: string) => void, path = `/${node.tag}`): void {
  visit(node, path);
  for (const child of node.children) {
    walk(child, visit, `${path}/${child.tag}`);
  }
}
