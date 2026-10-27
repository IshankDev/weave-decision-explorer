const STYLES = {
  sticky: "bg-sticky-soft text-sticky",
  failover: "bg-danger-soft text-danger",
  "cross-format": "bg-warn-soft text-warn",
  subscription: "bg-accent-soft text-accent",
  error: "bg-danger-soft text-danger",
} as const;

export function Badge({
  kind,
  children,
  title,
}: {
  kind: keyof typeof STYLES;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLES[kind]}`}
    >
      {children}
    </span>
  );
}
