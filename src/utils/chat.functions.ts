import { createServerFn } from "@tanstack/react-start";

interface ChatInput {
  question: string;
  presetTitle: string;
  subgraph: {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; label: string }>;
  };
}

export const chatGraphRAG = createServerFn({ method: "POST" })
  .inputValidator((input: ChatInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { error: "LOVABLE_API_KEY is not configured.", answer: null as string | null };
    }

    const nodesText = data.subgraph.nodes
      .map((n) => `- ${n.id} (${n.type}): "${n.label}"`)
      .join("\n");
    const edgesText = data.subgraph.edges
      .map((e) => `- (${e.source}) -[${e.label}]-> (${e.target})`)
      .join("\n");

    const systemPrompt = `You are a GraphRAG assistant answering questions grounded in a small knowledge graph.
Dataset: ${data.presetTitle}.
Use ONLY the entities and relationships below. If the answer is not derivable from the graph, say so plainly.
Cite specific entity labels and relationships in your answer. Keep responses concise (3-5 sentences).

ENTITIES:
${nodesText}

RELATIONSHIPS:
${edgesText}`;

    try {
      const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.question },
          ],
        }),
      });

      if (upstream.status === 429) {
        return { error: "Rate limited — please wait and try again.", answer: null };
      }
      if (upstream.status === 402) {
        return {
          error: "Lovable AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          answer: null,
        };
      }
      if (!upstream.ok) {
        const t = await upstream.text();
        console.error("AI gateway error:", upstream.status, t);
        return { error: "Live LLM request failed.", answer: null };
      }

      const json = (await upstream.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const answer = json.choices?.[0]?.message?.content ?? "";
      return { error: null as string | null, answer };
    } catch (e) {
      console.error("chat error:", e);
      return { error: "Network error contacting Live LLM.", answer: null };
    }
  });
