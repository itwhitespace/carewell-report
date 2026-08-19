"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/data", label: "นำเข้าข้อมูล" },
  { href: "/slides", label: "สไลด์นำเสนอ" },
];

export function NavBar() {
  const pathname = usePathname();

  // The presentation is a fullscreen, fullwidth, fixed-dark deck with its
  // own minimal back-link — the site chrome would eat into the stage.
  if (pathname === "/slides") return null;

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-3">
        <span className="mr-4 text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          CareWell Report
        </span>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
