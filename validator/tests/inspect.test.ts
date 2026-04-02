import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { runInspect } from "../src/app/inspect.js";

const ROOT = resolve("/Users/d-robotics/lab/nml/validator");

test("inspect returns summary and writes AST json", () => {
  const outFile = resolve(ROOT, "reports/test.inspect.ast.json");
  if (existsSync(outFile)) rmSync(outFile, { force: true });

  const out = runInspect({
    file: resolve(ROOT, "src/samples/happy-path.nml"),
    parser: "tree-sitter",
    astJsonOutFile: outFile,
  });

  assert.equal(out.summary.rootTag, "小说项目");
  assert.ok(out.summary.nodeCount > 0);
  assert.ok(out.summary.uniqueTags.includes("章节"));
  assert.equal(existsSync(outFile), true);
});

