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
    <header className="sticky top-0 z-30 chrome">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[13px] font-semibold text-background"
          >
            ✦
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-medium tracking-[-0.02em] text-foreground">
              Decision Explorer
            </span>
            <span className="truncate text-[11px] text-muted">
              Unofficial · Weave Router analytics
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="segmented">
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
                className={`segmented-item ${active ? "is-active" : ""}`}
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
