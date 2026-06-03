import { decode, PROTO_ID } from "../../src/proto.ts";
import { GRID_MARKER, COL_MARKER, ROW_MARKER, TITLE_MARKER, ROW_SEP as SEP_MARKER, KV_RELATION, GRID_REF } from "../markzero/src/util.ts";
import { encode as encodeMacro } from "../../src/proto.ts";
import { mergeHelp } from "../../src/help.ts";
import { existsSync, readFileSync } from "node:fs";
import { renderMarkdown } from "../markzero-md/markzero-md.ts";
import { renderToon } from "../markzero-toon/markzero-toon.ts";
import { renderZon } from "../markzero-zon/markzero-zon.ts";

export const desc = "Universal MarkZero viewer and inspector";

// ANSI Colors
export const BOLD = (s: any) => `\x1b[1m${s}\x1b[22m`;
export const YELLOW = (s: any) => `\x1b[33m${s}\x1b[39m`;
export const CYAN = (s: any) => `\x1b[36m${s}\x1b[39m`;
export const DIM = (s: any) => `\x1b[90m${s}\x1b[39m`;

const papHelp = encodeMacro(mergeHelp({
  usage: "mz <file> [options]",
  command_desc: desc,
  flag: ["--json", "--json5", "--yaml", "--md", "--toon", "--zon", "--pretty"],
  desc: [
    "Output as JSON",
    "Output as JSON5",
    "Output as YAML",
    "Output as Markdown tables/lists",
    "Output as TOON (Token Oriented Object Notation)",
    "Output as ZON (Zig Object Notation)",
    "Output formatted raw MarkZero notation"
  ]
}));
export function help(decoder?: (pap: string) => void) {
  if (decoder) decoder(papHelp);
  else process.stdout.write(papHelp + '\n');
}

/**
 * Renders formatted (pretty) raw MarkZero notation.
 */
function renderPrettyMZ(blocks: any[]): string {
    const GRID = CYAN(GRID_MARKER);
    const COL = YELLOW(COL_MARKER);
    const ROW = YELLOW(ROW_MARKER);
    const TITLE = CYAN(TITLE_MARKER);
    const SEP = DIM(SEP_MARKER);
    const BINDER = DIM(KV_RELATION);

    let out = CYAN(PROTO_ID);
    
    blocks.forEach(block => {
        if ((block as any).title) out += `\n${TITLE} ${(block as any).title}`;
        
        if (Array.isArray(block)) {
            if (block.length === 0) return;
            const first = block[0];
            const isTable = typeof first === 'object' && !Array.isArray(first);
            
            if (isTable) {
                const headers = Object.keys(first);
                out += `\n${GRID} ${COL} ${headers.join(` ${SEP} `)}`;
                block.forEach(row => {
                    const vals = headers.map(h => {
                        const val = row[h];
                        // If value is a nested structure (from decode), it's hard to re-encode perfectly here
                        // but for 'mz' view we just show it.
                        return typeof val === 'object' ? GRID_REF : String(val);
                    });
                    out += `\n   ${ROW} ${vals.join(`  ${SEP} `)}`;
                });
            } else {
                // 1D Set
                out += `\n${GRID}`;
                block.forEach((item, idx) => {
                    out += `\n   ${ROW} ${item}`;
                });
            }
        } else if (typeof block === 'object' && block !== null) {
            // Map
            out += `\n${GRID}`;
            Object.entries(block).forEach(([k, v], idx) => {
                if (k === 'title') return;
                out += `\n   ${ROW} ${k} ${BINDER} ${v}`;
            });
        }
        out += "\n";
    });
    return out;
}

function renderTable(data: any[]) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => String(row[h] ?? "").split("\n")));

  const colWidths = headers.map((h, i) => {
    let maxWidth = Bun.stringWidth(h);
    rows.forEach(rowLines => rowLines[i].forEach(line => maxWidth = Math.max(maxWidth, Bun.stringWidth(line))));
    return maxWidth;
  });

  const buildLine = (left: string, mid: string, right: string, dash: string) =>
    left + colWidths.map(w => dash.repeat(w + 2)).join(mid) + right;

  console.log(buildLine('┌', '┬', '┐', '─'));
  console.log('│ ' + headers.map((h, i) => BOLD(CYAN(h.toUpperCase())) + ' '.repeat(colWidths[i] - Bun.stringWidth(h))).join(' │ ') + ' │');
  console.log(buildLine('├', '┼', '┤', '─'));

  rows.forEach(rowCells => {
    const rowHeight = Math.max(...rowCells.map(cellLines => cellLines.length));
    for (let l = 0; l < rowHeight; l++) {
      let lineOutput = "│ ";
      rowCells.forEach((cellLines, colIdx) => {
        const lineText = cellLines[l] || "";
        lineOutput += lineText + ' '.repeat(colWidths[colIdx] - Bun.stringWidth(lineText));
        if (colIdx < rowCells.length - 1) lineOutput += " │ ";
      });
      console.log(lineOutput + " │");
    }
  });
  console.log(buildLine('└', '┴', '┘', '─'));
}

function renderHelpData(helpMap: any) {
    if (helpMap.command_desc) console.log(helpMap.command_desc + "\n");
    if (helpMap.usage) console.log(BOLD("Usage:") + `\n  ${helpMap.usage}\n`);
    console.log(BOLD("Options:"));
    const flags = Array.isArray(helpMap.flag) ? helpMap.flag : [];
    const descs = Array.isArray(helpMap.desc) ? helpMap.desc : [];
    let maxFlagWidth = 0;
    flags.forEach(f => maxFlagWidth = Math.max(maxFlagWidth, Bun.stringWidth(String(f))));
    flags.forEach((f, idx) => {
        const flagStr = String(f);
        const descStr = descs[idx] || "";
        const pad = " ".repeat(maxFlagWidth - Bun.stringWidth(flagStr));
        console.log(`  ${YELLOW(flagStr)}${pad}  ${descStr}`);
    });
    console.log("");
}

export async function run(args: string[], decoder?: (pap: string) => void) {
  const isHumanHelp = args.includes('--h') || args.includes('--ha') || args.includes('--ah') || args.includes('-hasci') || args.includes('-hascii') || args.includes('--hasci') || args.includes('--hascii');
  const isAgentHelp = args.includes('--help') || args.includes('-h');

  if (isHumanHelp || isAgentHelp) {
    if (isHumanHelp && !decoder) {
      const { mark0ToAscii } = await import('../markzero-ascii/markzero-ascii.ts');
      help(mark0ToAscii);
    } else {
      help(decoder);
    }
    return;
  }

  try {
    const isJson = args.includes("--json");
    const positional = args.filter(a => !a.startsWith("-"));
    
    let input = "";
    if (positional.length > 0) {
        const file = positional[0]!;
        if (existsSync(file)) {
            input = readFileSync(file, "utf-8");
        } else {
            // treat as raw mz string
            input = file;
        }
    } else {
        // read from stdin
        input = await Bun.stdin.text();
    }

    if (!input.trim()) return;

    const blocks = decode(input.trim());
    
    if (args.includes("--json")) {
        console.log(JSON.stringify(blocks, null, 2));
        return;
    }

    if (args.includes("--json5")) {
        // @ts-ignore
        console.log(Bun.JSON5.stringify(blocks, null, 2));
        return;
    }

    if (args.includes("--yaml")) {
        // @ts-ignore
        console.log(Bun.YAML.stringify(blocks, null, 2));
        return;
    }

    if (args.includes("--md")) {
        console.log(renderMarkdown(blocks));
        return;
    }

    if (args.includes("--toon")) {
        console.log(renderToon(blocks));
        return;
    }

    if (args.includes("--zon")) {
        console.log(renderZon(blocks));
        return;
    }

    if (args.includes("--pretty")) {
        console.log(renderPrettyMZ(blocks));
        return;
    }

    // Pretty ASCII Rendering (Default)
    const helpMap = blocks.find(b => b && !Array.isArray(b) && b.command_desc !== undefined);
    if (helpMap) {
        renderHelpData(helpMap);
        return;
    }

    blocks.forEach(block => {
        if (Array.isArray(block) && block.length > 0) {
            renderTable(block);
        } else if (typeof block === 'object' && block !== null) {
            const entries = Object.entries(block).filter(([k]) => k !== 'title');
            if ((block as any).title) console.log(`${BOLD('TITLE:')} ${YELLOW((block as any).title)}`);
            entries.forEach(([k, v]) => console.log(`${BOLD(k.toUpperCase())}: ${v}`));
        }
    });

  } catch (e) {
    console.error("Error encountered in mz tool:");
    if (e instanceof Error) {
        console.error(e.stack || e.message);
    } else {
        console.error(e);
    }
    process.exit(1);
  }
}

if (import.meta.main) {
  run(process.argv.slice(2)).catch((e) => {
      console.error("Fatal error:", e.stack || e.message);
      process.exit(1);
  });
}
