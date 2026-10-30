"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type { Decision } from "@/lib/schema";
import { formatMs, formatTimestamp, formatUsd } from "@/lib/format";
import { Badge } from "./Badge";

const ROW_HEIGHT = 44;
const OVERSCAN = 8;

export function DecisionsTable({
  data,
  onRowClick,
  selectedId,
}: {
  data: Decision[];
  onRowClick: (id: string) => void;
  selectedId: string | null;
}) {
  const columns = useMemo<ColumnDef<Decision>[]>(
    () => [
      {
        id: "time",
        header: "Time",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs">
            {formatTimestamp(row.original.requested_at)}
          </span>
        ),
      },
      {
        id: "session",
        header: "Session",
        cell: ({ row }) =>
          row.original.session_id ? (
            <Link
              href={`/sessions/${encodeURIComponent(row.original.session_id)}`}
              className="font-mono text-xs text-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.session_id.replace(/^demo-session-/, "")}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "turn_type",
        header: "Turn",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        id: "models",
        header: "Requested → Decision",
        cell: ({ row }) => {
          const req = row.original.requested_model ?? "—";
          const dec = row.original.decision_model ?? "—";
          const switched = req !== dec;
          return (
            <span className="font-mono text-xs">
              {req}
              {switched ? (
                <span className="mx-1 font-bold text-accent" aria-label="switched to">
                  →
                </span>
              ) : (
                <span className="mx-1 text-muted">·</span>
              )}
              {dec}
            </span>
          );
        },
      },
      {
        accessorKey: "decision_provider",
        header: "Provider",
        cell: ({ getValue }) => (
          <span className="text-xs">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        id: "badges",
        header: "Badges",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.sticky_hit && <Badge kind="sticky">sticky</Badge>}
            {row.original.failover_used && <Badge kind="failover">failover</Badge>}
            {row.original.cross_format && (
              <Badge kind="cross-format">cross-format</Badge>
            )}
            {row.original.subscription_served && (
              <Badge kind="subscription">subscription</Badge>
            )}
            {row.original.error_class && (
              <Badge kind="error">{row.original.error_class}</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "chosen_score",
        header: "Score",
        cell: ({ getValue }) => {
          const v = getValue() as number | null | undefined;
          return (
            <span className="tabular-nums text-xs">
              {v == null ? "—" : v.toFixed(3)}
            </span>
          );
        },
      },
      {
        id: "route_ms",
        header: "Route",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {formatMs(row.original.route_latency_ms)}
          </span>
        ),
      },
      {
        id: "total_ms",
        header: "Total",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {formatMs(row.original.total_latency_ms)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {row.original.upstream_status_code ?? "—"}
          </span>
        ),
      },
      {
        id: "cost",
        header: "Cost",
        cell: ({ row }) => {
          const a = row.original.actual_input_cost_usd;
          const b = row.original.actual_output_cost_usd;
          if (a == null && b == null) {
            return <span className="text-xs text-muted">unpriced</span>;
          }
          return (
            <span className="tabular-nums text-xs">
              {formatUsd((a ?? 0) + (b ?? 0))}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(480);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewport(el.clientHeight));
    ro.observe(el);
    setViewport(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    if (parentRef.current) setScrollTop(parentRef.current.scrollTop);
  }, []);

  const rows = table.getRowModel().rows;
  const totalHeight = rows.length * ROW_HEIGHT;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewport / ROW_HEIGHT) + OVERSCAN * 2;
  const end = Math.min(rows.length, start + visibleCount);
  const visible = rows.slice(start, end);

  return (
    <div
      ref={parentRef}
      onScroll={onScroll}
      className="panel h-[min(70vh,640px)] overflow-auto"
      role="region"
      aria-label="Decisions table"
    >
      <table className="min-w-[960px] w-full border-collapse text-left text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-border bg-surface-muted/95 text-[11px] font-medium uppercase tracking-[0.04em] text-muted backdrop-blur-md">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2.5 font-medium whitespace-nowrap">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {start > 0 && (
            <tr aria-hidden>
              <td colSpan={columns.length} style={{ height: start * ROW_HEIGHT }} />
            </tr>
          )}
          {visible.map((row) => {
            const selected = row.id === selectedId;
            return (
              <tr
                key={row.id}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                onClick={() => onRowClick(row.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row.id);
                  }
                }}
                className={`cursor-pointer border-b border-border transition-colors ${
                  selected ? "bg-accent-soft" : "hover:bg-[var(--fill)]"
                }`}
                style={{ height: ROW_HEIGHT }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-1 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {end < rows.length && (
            <tr aria-hidden>
              <td
                colSpan={columns.length}
                style={{ height: (rows.length - end) * ROW_HEIGHT }}
              />
            </tr>
          )}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-muted">
                No decisions match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="sr-only" aria-live="polite">
        {rows.length} rows, virtual height {totalHeight}px
      </div>
    </div>
  );
}
