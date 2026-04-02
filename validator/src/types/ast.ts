export interface AstNode {
  tag: string;
  attributes: Record<string, string>;
  text?: string;
  children: AstNode[];
}

export interface NmlDocument {
  root: AstNode;
  filePath?: string;
}
