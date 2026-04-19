import { createFileRoute } from "@tanstack/react-router";

interface ChatBody {
  question: string;
  presetTitle: string;
  subgraph: {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; label: string }>;
  };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let body: ChatBody;
        try {
          body = (await request.json()) as ChatBody;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { question, presetTitle, subgraph } = body;
        const nodesText = subgraph.nodes
          .map((n) => `- ${n.id} (${n.type}): "${n.label}"`)
          .join("\n");
        const edgesText = subgraph.edges
          .map((e) => `- (${e.source}) -[${e.label}]-> (${e.target})`)
          .join("\n");

        const systemPrompt = `You are a GraphRAG assistant answering questions grounded in a small knowledge graph.
Dataset: ${presetTitle}.
Use ONLY the entities and relationships below. If the answer is not derivable from the graph, say so plainly.
Cite specific entity labels and relationships in your answer. Keep responses concise (3-5 sentences).

ENTITIES:
${nodesText}

RELATIONSHIPS:
${edgesText}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: question },
            ],
          }),
        });

        if (upstream.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (upstream.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text();
          console.error("AI gateway error:", upstream.status, t);
          return new Response(JSON.stringify({ error: "Upstream error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    },
  },
});
