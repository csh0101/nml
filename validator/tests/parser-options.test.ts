import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createParserAdapter, parseCliArgs } from "../src/cli/parser-options.js";

const ROOT = resolve("/Users/d-robotics/lab/nml/validator");

test("parseCliArgs accepts rust-nom parser kind", () => {
  const { parser, fileArg } = parseCliArgs(["--parser", "rust-nom", "src/samples/happy-path.nml"]);
  assert.equal(parser, "rust-nom");
  assert.equal(fileArg, "src/samples/happy-path.nml");
});

test("parseCliArgs supports --parser=value form and defaults to xml", () => {
  const parsed1 = parseCliArgs(["--parser=tree-sitter", "a.nml"]);
  assert.equal(parsed1.parser, "tree-sitter");
  assert.equal(parsed1.fileArg, "a.nml");

  const parsed2 = parseCliArgs(["a.nml"]);
  assert.equal(parsed2.parser, "xml");
  assert.equal(parsed2.fileArg, "a.nml");
});

test("createParserAdapter throws on unsupported parser", () => {
  assert.throws(() => createParserAdapter("unknown-parser" as never), /Unsupported parser kind/);
});

test("rust-nom adapter parses NML when cargo is available", (t) => {
  const cargo = spawnSync("cargo", ["--version"], { encoding: "utf-8" });
  if (cargo.status !== 0) {
    t.skip("cargo is unavailable in current environment");
    return;
  }

  const file = resolve(ROOT, "src/samples/happy-path.nml");
  const xml = readFileSync(file, "utf-8");
  const adapter = createParserAdapter("rust-nom");
  const doc = adapter.parse(xml, file);

  assert.equal(doc.root.tag, "小说项目");
  assert.equal(doc.root.attributes["名称"], "剑起大荒");
  assert.ok(doc.root.children.length > 0);
});
