"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/decisions", label: "Decisions" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold tracking-tight text-foreground">
            Weave Decision Explorer
          </span>
          <span className="truncate text-xs text-muted group-hover:text-accent">
            Why did the router pick that model?
          </span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
