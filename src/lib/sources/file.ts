import { parseDecisionRow, type Decision } from "../schema";

export const MAX_ROWS_IN_MEMORY = 200_000;

export interface FileParseResult {
  decisions: Decision[];
  skippedLines: number;
  firstSkipError: string | null;
  truncated: boolean;
  totalLines: number;
}

/**
 * Stream-parse an NDJSON / JSONL File via File.stream() + TextDecoder.
 * Dedupes on `id` (later wins). Caps at MAX_ROWS_IN_MEMORY.
 */
export async function parseNdjsonFile(file: File): Promise<FileParseResult> {
  const byId = new Map<string, Decision>();
  let skippedLines = 0;
  let firstSkipError: string | null = null;
  let totalLines = 0;
  let truncated = false;
  let buffer = "";

  const decoder = new TextDecoder("utf-8");
  const reader = file.stream().getReader();

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    totalLines += 1;
    if (byId.size >= MAX_ROWS_IN_MEMORY) {
      truncated = true;
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch (err) {
      skippedLines += 1;
      if (!firstSkipError) {
        firstSkipError =
          err instanceof Error ? err.message : "Invalid JSON on line";
      }
      return;
    }
    const parsed = parseDecisionRow(raw);
    if (!parsed.ok) {
      skippedLines += 1;
      if (!firstSkipError) firstSkipError = parsed.error;
      return;
    }
    byId.set(parsed.data.id, parsed.data);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) consumeLine(line);
  }
  buffer += decoder.decode();
  if (buffer.trim()) consumeLine(buffer);

  return {
    decisions: Array.from(byId.values()),
    skippedLines,
    firstSkipError,
    truncated,
    totalLines,
  };
}
