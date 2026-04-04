import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { NmlDocument } from "../types/ast.js";
import type { ParserAdapter } from "./parser-adapter.js";

const BINARY_NAME = process.platform === "win32" ? "nml-parser-rs.exe" : "nml-parser-rs";

let binaryPrepared = false;

function resolveParserRsDir(): string {
  const current = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.NML_PARSER_RS_DIR,
    resolve(process.cwd(), "..", "parser-rs"),
    resolve(process.cwd(), "parser-rs"),
    resolve(current, "../../../../parser-rs"),
    resolve(current, "../../../parser-rs"),
    resolve(current, "../../parser-rs"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (existsSync(resolve(p, "Cargo.toml"))) return p;
  }

  throw new Error(`Cannot locate parser-rs directory. Tried: ${candidates.join(", ")}`);
}

function binaryPath(parserRsDir: string): string {
  return resolve(parserRsDir, "target", "debug", BINARY_NAME);
}

function ensureBinaryReady(): void {
  const parserRsDir = resolveParserRsDir();
  const binPath = binaryPath(parserRsDir);
  if (binaryPrepared && existsSync(binPath)) return;

  const build = spawnSync("cargo", ["build", "--quiet"], {
    cwd: parserRsDir,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (build.status !== 0 || !existsSync(binPath)) {
    const stderr = (build.stderr ?? "").trim();
    const stdout = (build.stdout ?? "").trim();
    throw new Error(`Failed to build parser-rs binary at ${binPath}. ${stderr || stdout || "No build output."}`);
  }

  binaryPrepared = true;
}

function parseJsonToDocument(raw: string): NmlDocument {
  const parsed = JSON.parse(raw) as NmlDocument;
  if (!parsed || !parsed.root || typeof parsed.root.tag !== "string") {
    throw new Error("Invalid AST JSON from rust parser");
  }
  return parsed;
}

export class RustNomAdapter implements ParserAdapter {
  parse(content: string, filePath?: string): NmlDocument {
    ensureBinaryReady();
    const parserRsDir = resolveParserRsDir();
    const binPath = binaryPath(parserRsDir);

    let tempDir: string | undefined;
    let inputPath = filePath;
    if (!inputPath) {
      tempDir = mkdtempSync(join(tmpdir(), "nml-rs-"));
      inputPath = join(tempDir, "input.nml");
      writeFileSync(inputPath, content, "utf-8");
    }

    const run = spawnSync(binPath, [inputPath], {
      cwd: parserRsDir,
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
    });

    if (tempDir) rmSync(tempDir, { recursive: true, force: true });

    if (run.status !== 0) {
      const stderr = (run.stderr ?? "").trim();
      const stdout = (run.stdout ?? "").trim();
      throw new Error(`Rust parser failed. ${stderr || stdout || "No process output."}`);
    }

    return parseJsonToDocument((run.stdout ?? "").trim());
  }
}
