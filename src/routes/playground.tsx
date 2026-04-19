import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Home,
  Info,
  Lightbulb,
  Redo2,
  Sparkles,
  Tag,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PRESETS, getPreset, type PresetQuestion } from "@/data/presets";
import { usePlayground } from "@/store/playground";

const search = z.object({
  preset: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Playground — GraphRAG Playground" },
      {
        name: "description",
        content:
          "3-panel sandbox: pick a preset, ask a question, see the retrieved subgraph and a graph-grounded answer side-by-side with baseline RAG.",
      },
      { property: "og:title", content: "GraphRAG Playground" },
      {
        property: "og:description",
        content: "Interactive sandbox to learn GraphRAG.",
      },
    ],
  }),
  validateSearch: zodValidator(search),
  component: PlaygroundPage,
});

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Tag className="h-3 w-3" />
      <span>{children}</span>
      {hint && (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 cursor-help text-muted-foreground/60" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function PlaygroundPage() {
  const { preset: presetParam } = Route.useSearch();
  const store = usePlayground();
  const { present, past, future } = store;

  // Hydrate from localStorage once
  useEffect(() => {
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply preset query param on mount
  useEffect(() => {
    if (presetParam && getPreset(presetParam) && presetParam !== present.presetId) {
      store.apply({
        presetId: presetParam,
        question: "",
        askedQuestionId: null,
        customAnswer: null,
        customAnswered: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetParam]);

  const preset = getPreset(present.presetId) ?? PRESETS[0];

  const askedQ = useMemo<PresetQuestion | null>(
    () => preset.questions.find((q) => q.id === present.askedQuestionId) ?? null,
    [preset, present.askedQuestionId],
  );

  const [showCompare, setShowCompare] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setPreset = (id: string) => {
    store.apply({
      presetId: id,
      question: "",
      askedQuestionId: null,
      customAnswer: null,
      customAnswered: false,
    });
    setShowExplain(false);
    setShowCompare(false);
  };

  const ask = async () => {
    const q = present.question.trim();
    if (!q) return;
    const matched = preset.questions.find(
      (pq) => pq.question.toLowerCase() === q.toLowerCase(),
    );
    if (matched) {
      store.apply({
        askedQuestionId: matched.id,
        customAnswer: null,
        customAnswered: false,
        recentQuestions: [q, ...present.recentQuestions.filter((r) => r !== q)].slice(0, 10),
      });
      return;
    }
    // Custom question
    if (!present.liveLLM) {
      store.apply({
        askedQuestionId: null,
        customAnswered: true,
        customAnswer:
          "Enable Live LLM (top right toggle) to generate answers for custom questions. Otherwise, try one of the example questions — they have preloaded graph and baseline answers.",
        recentQuestions: [q, ...present.recentQuestions.filter((r) => r !== q)].slice(0, 10),
      });
      return;
    }
    // Live LLM call
    setLoading(true);
    store.apply(
      {
        askedQuestionId: null,
        customAnswered: true,
        customAnswer: "",
        recentQuestions: [q, ...present.recentQuestions.filter((r) => r !== q)].slice(0, 10),
      },
      { trackHistory: false },
    );
    try {
      const subgraph = {
        nodes: preset.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
        edges: preset.edges.map((e) => ({ source: e.source, target: e.target, label: e.label })),
      };
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, subgraph, presetTitle: preset.title }),
      });
      if (resp.status === 402) {
        toast.error("Lovable AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        store.apply({ customAnswer: "[Credits required to use Live LLM.]" }, { trackHistory: false });
        setLoading(false);
        return;
      }
      if (resp.status === 429) {
        toast.error("Rate limit reached — please wait and try again.");
        store.apply({ customAnswer: "[Rate limit reached.]" }, { trackHistory: false });
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("Live LLM request failed.");
        setLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let answerSoFar = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              answerSoFar += delta;
              store.apply({ customAnswer: answerSoFar }, { trackHistory: false });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error contacting Live LLM.");
    } finally {
      setLoading(false);
    }
  };

  const highlightedNodeIds = askedQ?.retrievedNodes ?? [];
  const highlightedEdgeIds = askedQ?.retrievedEdges ?? [];

  // ----- Panels -----
  const LeftPanel = (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label hint="A preloaded dataset of source documents and an extracted graph.">Preset</Label>
        <Select value={present.presetId} onValueChange={setPreset}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{preset.description}</p>
      </div>

      <div className="space-y-2">
        <Label hint="The raw text the graph was extracted from.">Source documents</Label>
        <ul className="space-y-1.5">
          {preset.documents.map((d) => {
            const open = openDoc === d.id;
            return (
              <li key={d.id} className="rounded-md border border-border bg-card">
                <button
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => setOpenDoc(open ? null : d.id)}
                >
                  <span className="truncate">{d.title}</span>
                  {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {open && (
                  <div className="border-t border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {d.text}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <Label>Question</Label>
        <Input
          value={present.question}
          onChange={(e) => store.apply({ question: e.target.value })}
          placeholder="Ask something about this graph…"
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
        />
        <Button onClick={ask} disabled={loading || !present.question.trim()} className="w-full">
          {loading ? "Asking…" : "Ask"}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Example questions</Label>
        <div className="flex flex-wrap gap-1.5">
          {preset.questions.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                store.apply({
                  question: q.question,
                  askedQuestionId: q.id,
                  customAnswer: null,
                  customAnswered: false,
                });
                setShowExplain(false);
              }}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {q.question}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label hint="Notes are saved per preset, in your browser.">Notes</Label>
        <Textarea
          value={present.notesByPreset[preset.id] ?? ""}
          onChange={(e) =>
            store.apply(
              {
                notesByPreset: { ...present.notesByPreset, [preset.id]: e.target.value },
              },
              { trackHistory: false },
            )
          }
          placeholder="Jot down what you learned…"
          className="min-h-[80px]"
        />
      </div>
    </div>
  );

  const CenterPanel = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label hint="The extracted graph: nodes are entities, edges are typed relationships.">
          Knowledge graph
        </Label>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <Switch
              checked={present.showLabels}
              onCheckedChange={(v) => store.apply({ showLabels: v })}
            />
            Labels
          </label>
          <label className="flex items-center gap-1.5">
            <Switch
              checked={present.retrievedOnly}
              onCheckedChange={(v) => store.apply({ retrievedOnly: v })}
            />
            Retrieved only
          </label>
        </div>
      </div>

      <GraphCanvas
        nodes={preset.nodes}
        edges={preset.edges}
        highlightedNodeIds={highlightedNodeIds}
        highlightedEdgeIds={highlightedEdgeIds}
        showLabels={present.showLabels}
        retrievedOnly={present.retrievedOnly}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <Label hint="The nodes the retriever pulled from the graph for this question.">
            Retrieved nodes ({highlightedNodeIds.length})
          </Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlightedNodeIds.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                Ask a question to see the subgraph.
              </span>
            ) : (
              highlightedNodeIds.map((id) => {
                const n = preset.nodes.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs"
                  >
                    <span className="text-muted-foreground">{n?.type}:</span>
                    {n?.label}
                  </span>
                );
              })
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <Label hint="The edges (typed relationships) used to ground the answer.">
            Retrieved edges ({highlightedEdgeIds.length})
          </Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlightedEdgeIds.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              highlightedEdgeIds.map((id) => {
                const e = preset.edges.find((x) => x.id === id);
                if (!e) return null;
                const s = preset.nodes.find((n) => n.id === e.source)?.label;
                const t = preset.nodes.find((n) => n.id === e.target)?.label;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs"
                  >
                    {s} <span className="text-muted-foreground">[{e.label}]→</span> {t}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const RightPanel = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label hint="The LLM answer grounded in the retrieved subgraph or chunks.">Answer</Label>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={showCompare} onCheckedChange={setShowCompare} />
          Compare baseline RAG
        </label>
      </div>

      {!askedQ && !present.customAnswered && (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Pick an example question or ask your own.
        </div>
      )}

      {present.customAnswered && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {present.liveLLM ? "Live LLM answer" : "Note"}
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">
            {present.customAnswer || (loading ? "…" : "")}
          </p>
        </div>
      )}

      {askedQ && (
        <div className={showCompare ? "grid grid-cols-1 gap-3 lg:grid-cols-2" : "space-y-3"}>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground">
              <Sparkles className="h-3 w-3" /> GraphRAG answer
            </div>
            <p className="text-sm leading-relaxed">{askedQ.graphAnswer}</p>
            <div className="mt-3 border-t border-border pt-2">
              <Label hint="The specific entities cited as evidence.">Grounded in</Label>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {askedQ.retrievedNodes.map((id) => {
                  const n = preset.nodes.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground"
                    >
                      {n?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {showCompare && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Eye className="h-3 w-3" /> Baseline RAG answer
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {askedQ.baselineAnswer}
              </p>
              <div className="mt-3 border-t border-border pt-2">
                <Label hint="Plain text chunks the baseline retriever pulled.">
                  Retrieved chunks
                </Label>
                <div className="mt-1.5 space-y-1">
                  {askedQ.baselineChunks.map((id) => {
                    const d = preset.documents.find((x) => x.id === id);
                    if (!d) return null;
                    return (
                      <div
                        key={id}
                        className="rounded border border-border bg-background p-2 text-[11px] text-muted-foreground"
                      >
                        <div className="font-medium text-foreground">{d.title}</div>
                        <div className="mt-0.5 line-clamp-2">{d.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {askedQ && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowExplain((s) => !s)}>
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            {showExplain ? "Hide explanation" : "Explain this result"}
          </Button>
          {showExplain && (
            <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed">
              {askedQ.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Action bar */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={store.undo}
              disabled={past.length === 0}
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={store.redo}
              disabled={future.length === 0}
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Redo</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => store.reset()} asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Reset</span>
              </Link>
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Switch
              checked={present.liveLLM}
              onCheckedChange={(v) => store.apply({ liveLLM: v })}
            />
            <span>Live LLM</span>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  When ON, custom questions are answered by Lovable AI grounded in the
                  current graph. When OFF, only preloaded example questions return answers.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
        </div>
      </div>

      {/* Desktop 3-panel */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="hidden gap-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_380px]">
          <aside>{LeftPanel}</aside>
          <section>{CenterPanel}</section>
          <aside>{RightPanel}</aside>
        </div>

        {/* Tablet: left collapses, tabs for graph/answer */}
        <div className="hidden gap-6 sm:block lg:hidden">
          <div className="mb-6">{LeftPanel}</div>
          <Tabs defaultValue="graph">
            <TabsList>
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="answer">Answer</TabsTrigger>
            </TabsList>
            <TabsContent value="graph" className="mt-4">
              {CenterPanel}
            </TabsContent>
            <TabsContent value="answer" className="mt-4">
              {RightPanel}
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile: tabs */}
        <div className="sm:hidden">
          <Tabs defaultValue="inputs">
            <TabsList className="w-full">
              <TabsTrigger value="inputs" className="flex-1">
                Sources
              </TabsTrigger>
              <TabsTrigger value="graph" className="flex-1">
                Graph
              </TabsTrigger>
              <TabsTrigger value="answer" className="flex-1">
                Answer
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inputs" className="mt-4">
              {LeftPanel}
            </TabsContent>
            <TabsContent value="graph" className="mt-4">
              {CenterPanel}
            </TabsContent>
            <TabsContent value="answer" className="mt-4">
              {RightPanel}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
