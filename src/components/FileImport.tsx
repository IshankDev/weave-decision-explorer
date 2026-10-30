"use client";

import { useCallback, useState } from "react";
import { parseNdjsonFile } from "@/lib/sources/file";
import { useStore } from "@/lib/store/StoreProvider";

export function FileImport() {
  const { dispatch } = useStore();
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const name = file.name.toLowerCase();
      if (!name.endsWith(".ndjson") && !name.endsWith(".jsonl")) {
        setMessage("Please choose a .ndjson or .jsonl file.");
        return;
      }
      dispatch({
        type: "LOAD_START",
        source: "file",
        label: `File: ${file.name}`,
      });
      setMessage(null);
      try {
        const result = await parseNdjsonFile(file);
        dispatch({
          type: "LOAD_SUCCESS",
          decisions: result.decisions,
          skippedLines: result.skippedLines,
          firstSkipError: result.firstSkipError,
          truncated: result.truncated,
        });
        const parts = [
          `Loaded ${result.decisions.length.toLocaleString()} rows from ${file.name}`,
        ];
        if (result.skippedLines > 0) {
          parts.push(
            `${result.skippedLines} lines skipped` +
              (result.firstSkipError ? ` (first: ${result.firstSkipError})` : ""),
          );
        }
        if (result.truncated) {
          parts.push("truncated at 200k rows");
        }
        setMessage(parts.join(" · "));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "File parse failed";
        dispatch({ type: "LOAD_ERROR", error: msg });
        setMessage(msg);
      }
    },
    [dispatch],
  );

  return (
    <section id="source-file" className="panel space-y-3 p-4">
      <h2 className="section-title">File import</h2>
      <p className="text-[13px] text-muted">
        Drop a Weave analytics export (<code className="font-mono text-muted-strong">.ndjson</code>{" "}
        / <code className="font-mono text-muted-strong">.jsonl</code>). Parsed in the browser;
        nothing is uploaded.
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files[0] ?? null);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed px-4 py-8 transition ${
          dragOver
            ? "border-accent bg-accent-soft"
            : "border-border-strong bg-surface-muted"
        }`}
      >
        <p className="text-[13px] text-muted">Drag & drop, or pick a file</p>
        <label className="btn btn-primary cursor-pointer">
          Choose file
          <input
            type="file"
            accept=".ndjson,.jsonl,application/x-ndjson,application/jsonl"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {message && (
        <p className="text-[13px] text-muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
