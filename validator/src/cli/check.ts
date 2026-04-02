import { runCheck } from "../app/check.js";
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
const reportOutArg = parseFlagValue(args, "report-out");
const generatedTextArg = parseFlagValue(args, "generated-text");

if (!fileArg) {
  console.error("Usage: npm run check -- <file.nml> [--parser xml|tree-sitter] [--generated-text text.txt] [--report-out report.json]");
  process.exit(1);
}

try {
  const out = runCheck({
    file: fileArg,
    parser,
    generatedTextFile: generatedTextArg,
    reportOutFile: reportOutArg,
  });

  console.log(JSON.stringify(out.result, null, 2));
  process.exit(out.result.passed ? 0 : 2);
} catch (err) {
  console.error(`Parse failed: ${(err as Error).message}`);
  process.exit(3);
}
