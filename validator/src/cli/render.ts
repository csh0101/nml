import { runRender } from "../app/render.js";

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
const irFile = args.find((x) => !x.startsWith("--"));
const modelArg = parseFlagValue(args, "model") ?? "claude";
const outArg = parseFlagValue(args, "out");

if (!irFile) {
  console.error("Usage: npm run render -- <prompt-ir.json> [--model claude|openai] [--out final-prompt.txt]");
  process.exit(1);
}

if (!(modelArg === "claude" || modelArg === "openai")) {
  console.error(`Unsupported model '${modelArg}', expected claude|openai`);
  process.exit(1);
}

try {
  const out = runRender({
    irFile,
    model: modelArg,
    outFile: outArg,
  });

  const payload = {
    irFile: out.irFile,
    model: out.model,
    outFile: out.outFile,
    prompt: out.prompt,
  };

  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
} catch (err) {
  console.error(`Render failed: ${(err as Error).message}`);
  process.exit(2);
}
