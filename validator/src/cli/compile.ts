import { runCompile } from "../app/compile.js";
import { parseCliArgs } from "./parser-options.js";

function parseFlagValue(argv: string[], name: string): string | undefined {
  const direct = `--${name}=`;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token.startsWith(direct)) return token.slice(direct.length);
    if (token === `--${name}`) return argv[i + 1];
  }
  return undefined;
}

const args = process.argv.slice(2);
const { parser, fileArg } = parseCliArgs(args);
const outArg = parseFlagValue(args, "out");
const chapterOrderRaw = parseFlagValue(args, "chapter-order");
const chapterOrder = chapterOrderRaw && /^\d+$/.test(chapterOrderRaw) ? Number(chapterOrderRaw) : undefined;

if (!fileArg) {
  console.error("Usage: npm run compile -- <file.nml> [--parser xml|tree-sitter|rust-nom] [--chapter-order 1] [--out prompt-ir.json]");
  process.exit(1);
}

try {
  const out = runCompile({
    file: fileArg,
    parser,
    chapterOrder,
    outFile: outArg,
  });

  const payload = {
    file: out.file,
    parser: out.parser,
    passed: !out.validation.issues.some((x) => x.severity === "error"),
    issues: out.validation.issues,
    ir: out.ir,
    outFile: out.outFile,
  };
  console.log(JSON.stringify(payload, null, 2));

  process.exit(payload.passed ? 0 : 2);
} catch (err) {
  console.error(`Compile failed: ${(err as Error).message}`);
  process.exit(3);
}

