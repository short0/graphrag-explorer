import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Network, Search, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { PRESETS } from "@/data/presets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GraphRAG Playground — Learn graph-based retrieval hands-on" },
      {
        name: "description",
        content:
          "Interactive sandbox to learn GraphRAG: see how documents become entities, how subgraphs are retrieved, and how graph-grounded answers compare with baseline RAG.",
      },
      { property: "og:title", content: "GraphRAG Playground" },
      {
        property: "og:description",
        content: "A hands-on sandbox for learning GraphRAG with preloaded examples.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Learning sandbox
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            See how GraphRAG actually works.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            GraphRAG turns documents into a graph of entities and relationships, then
            retrieves a small subgraph to ground an LLM's answer. Try a preset and watch
            the graph, retrieval, and reasoning happen step by step.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/playground" search={{ preset: "movies" }}>
                Try a preset <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/playground">Open blank playground</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Presets */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Preset demos</h2>
          <span className="text-xs text-muted-foreground">All preloaded — no setup</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <Link
              key={p.id}
              to="/playground"
              search={{ preset: p.id }}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium tracking-tight">{p.title}</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>{p.nodes.length} entities</span>
                <span>·</span>
                <span>{p.edges.length} relationships</span>
                <span>·</span>
                <span>{p.questions.length} example questions</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Four small steps turn raw documents into graph-grounded answers.
          </p>
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Ingest documents",
                desc: "Start from raw source text — articles, tickets, papers, anything.",
              },
              {
                icon: Network,
                title: "Extract a graph",
                desc: "Identify entities and typed relationships. The graph captures structure plain text loses.",
              },
              {
                icon: Search,
                title: "Retrieve a subgraph",
                desc: "For each question, traverse the graph to a small, relevant subgraph instead of fetching loose chunks.",
              },
              {
                icon: Sparkles,
                title: "Generate grounded answer",
                desc: "Pass the subgraph to the LLM. Answers cite specific nodes and edges.",
              },
            ].map((s, i) => (
              <li
                key={s.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-xs text-muted-foreground">Step {i + 1}</div>
                <h3 className="mt-1 font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Baseline RAG callout */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight">
            Baseline RAG vs GraphRAG
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Baseline RAG retrieves text chunks by similarity. GraphRAG traverses typed
            relationships to assemble a structured context. The playground shows both,
            side by side, so you can feel the difference on multi-hop questions.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/playground" search={{ preset: "company" }}>
                Compare on a multi-hop example <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          GraphRAG Playground · Built for learning.
        </div>
      </footer>
    </div>
  );
}
