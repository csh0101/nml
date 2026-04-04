import test from "node:test";
import assert from "node:assert/strict";
import { runRegression } from "../src/app/regress.js";

test("regression app passes all cases for xml parser", () => {
  const summary = runRegression({ parser: "xml" });
  assert.equal(summary.failed, 0);
  assert.ok(summary.total > 80);
});

test("regression app passes all cases for tree-sitter parser", () => {
  const summary = runRegression({ parser: "tree-sitter" });
  assert.equal(summary.failed, 0);
  assert.ok(summary.total > 80);
});
