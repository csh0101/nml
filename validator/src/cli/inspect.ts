import { runInspect } from "../app/inspect.js";
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
const astOut = parseFlagValue(args, "ast-json-out");

if (!fileArg) {
  console.error("Usage: npm run inspect -- <file.nml> [--parser xml|tree-sitter|rust-nom] [--ast-json-out ast.json]");
  process.exit(1);
}

try {
  const out = runInspect({
    file: fileArg,
    parser,
    astJsonOutFile: astOut,
  });

  console.log(JSON.stringify({ summary: out.summary, astJsonOutFile: out.astJsonOutFile }, null, 2));
  process.exit(0);
} catch (err) {
  console.error(`Inspect failed: ${(err as Error).message}`);
  process.exit(3);
}
