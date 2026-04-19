import { Link } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Network className="h-5 w-5 text-foreground" aria-hidden />
          <span>GraphRAG Playground</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Home
          </Link>
          <Link
            to="/playground"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Playground
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
