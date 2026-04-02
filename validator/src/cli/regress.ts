import { runRegression } from "../app/regress.js";
import { parseCliArgs } from "./parser-options.js";

function parseBaseDir(argv: string[]): string | undefined {
  const direct = "--base-dir=";
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token.startsWith(direct)) return token.slice(direct.length);
    if (token === "--base-dir") return argv[i + 1];
  }
  return undefined;
}

const args = process.argv.slice(2);
const { parser } = parseCliArgs(args);
const baseDir = parseBaseDir(args);

const summary = runRegression({ parser, baseDir });

for (const c of summary.cases) {
  if (c.passMatch && c.errMatch && c.warnMatch) {
    console.log(`REG_PASS ${c.file}`);
  } else {
    const actualErrors = c.actual.issues.filter((x) => x.severity === "error").map((x) => x.code).sort();
    const actualWarnings = c.actual.issues.filter((x) => x.severity === "warning").map((x) => x.code).sort();
    const expectedErrors = [...(c.expected.errorCodes ?? [])].sort();
    const expectedWarnings = [...(c.expected.warningCodes ?? [])].sort();

    console.error(`REG_FAIL ${c.file}`);
    console.error(`  expected passed=${c.expected.passed}, errors=${expectedErrors.join(",")}, warnings=${expectedWarnings.join(",")}`);
    console.error(`  actual   passed=${c.actual.passed}, errors=${actualErrors.join(",")}, warnings=${actualWarnings.join(",")}`);
  }
}

process.exit(summary.failed === 0 ? 0 : 2);
