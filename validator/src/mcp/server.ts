import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runCheck } from "../app/check.js";
import { runRegression } from "../app/regress.js";
import type { ParserKind } from "../cli/parser-options.js";

const server = new McpServer({
  name: "nml-validator-mcp",
  version: "0.1.0",
});

server.registerTool(
  "nml_check",
  {
    title: "NML Check",
    description: "Validate one NML file with structure/reference/rules and optional generated-text semantic checks.",
    inputSchema: {
      file: z.string().describe("Path to .nml file"),
      parser: z.enum(["xml", "tree-sitter"]).optional().describe("Parser kind. Default: tree-sitter"),
      generatedTextFile: z.string().optional().describe("Optional generated text file for semantic checks"),
      reportOutFile: z.string().optional().describe("Optional output report path"),
    },
  },
  async ({ file, parser, generatedTextFile, reportOutFile }) => {
    const out = runCheck({
      file,
      parser: (parser ?? "tree-sitter") as ParserKind,
      generatedTextFile,
      reportOutFile,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              file: out.file,
              parser: out.parser,
              passed: out.result.passed,
              issues: out.result.issues,
              reportOutFile: out.reportOutFile,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

server.registerTool(
  "nml_regress",
  {
    title: "NML Regress",
    description: "Run regression suite under src/samples/regression or a custom baseDir.",
    inputSchema: {
      parser: z.enum(["xml", "tree-sitter"]).optional().describe("Parser kind. Default: tree-sitter"),
      baseDir: z.string().optional().describe("Optional regression samples base dir"),
    },
  },
  async ({ parser, baseDir }) => {
    const summary = runRegression({
      parser: (parser ?? "tree-sitter") as ParserKind,
      baseDir,
    });

    const failedCases = summary.cases
      .filter((c) => !(c.passMatch && c.errMatch && c.warnMatch))
      .map((c) => c.file);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              parser: summary.parser,
              baseDir: summary.baseDir,
              total: summary.total,
              failed: summary.failed,
              failedCases,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
