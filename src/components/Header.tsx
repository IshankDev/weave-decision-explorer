import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/decisions", label: "Decisions" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex flex-col">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Weave Decision Explorer
          </span>
          <span className="text-xs text-muted group-hover:text-accent">
            Why did the router pick that model?
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
