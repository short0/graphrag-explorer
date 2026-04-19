
# GraphRAG Playground — Build Plan

A polished, minimalist single-page app to learn GraphRAG hands-on, with preloaded presets and an optional live LLM mode.

## Stack & foundations
- TanStack Start + Tailwind + shadcn/ui (already scaffolded)
- `react-force-graph-2d` for graph visualization
- Lovable Cloud + Lovable AI Gateway (edge function) for optional live answer generation
- All presets, entities, edges, and example answers preloaded in code (no backend needed for default flow)
- Theme via `next-themes`-style toggle with `class="dark"`; light mode default
- Persistence via `localStorage` (theme, current session, recent questions, notes, preset progress, undo/redo stacks)

## Routes
- `/` — Home (hero, presets, "How it works", CTA)
- `/playground` — 3-panel playground (with `?preset=` param)
- Each route gets its own `head()` metadata
- Root layout: shared minimal header (logo, theme toggle, link to Home/Playground) + footer

## Home screen
- Hero: one-line definition of GraphRAG + 2-sentence subhead, primary CTA "Try a preset", secondary "Open blank playground"
- 4 preset cards (Movies, Company Org, Customer Support, Research) — each shows title, 1-line description, entity/edge counts, "Launch" button
- "How it works" — 4 horizontal steps with small icons: Ingest → Extract → Retrieve subgraph → Generate
- Short "Baseline RAG vs GraphRAG" callout linking into playground

## Playground screen (3-panel desktop, stacked mobile)
**Left panel — Inputs**
- Preset selector (dropdown)
- Source documents list (clickable, expandable cards showing raw text)
- Question input + "Ask" button
- Example questions (chips) for the current preset
- Notes textarea (saved per preset)

**Center panel — Graph**
- Force-directed graph (react-force-graph-2d), nodes colored by entity type, edges labeled with relationship
- Highlights retrieved subgraph nodes/edges after a question is asked (others dimmed)
- Toolbar: zoom, recenter, toggle labels, toggle "show only retrieved"
- Below graph: list of retrieved nodes & edges with type badges

**Right panel — Answer**
- Generated answer card with "grounded in" citations linking to nodes
- "Explain this result" button → expands a plain-language walkthrough of how the subgraph produced the answer
- Side-by-side toggle: GraphRAG answer vs Baseline RAG answer (with retrieved chunks shown for baseline)
- Inline labels/tooltips for: document, entity, relationship, subgraph, retrieved context, grounded answer

**Top action bar (sticky on mobile)**
- Undo, Redo, Reset to home, Theme toggle, Live LLM toggle

## Presets (preloaded data, in `src/data/presets.ts`)
Each preset includes:
- 3–6 short source documents
- 8–20 entities with types, 10–30 typed relationships
- 4–6 example questions, each with: graph-grounded answer, baseline-RAG answer, retrieved subgraph (node/edge IDs), retrieved chunks for baseline, and an explanation

Presets:
1. **Movie Knowledge Graph** — actors, directors, films, genres (ACTED_IN, DIRECTED, BELONGS_TO)
2. **Company Org + Projects** — employees, teams, managers, projects, dependencies (REPORTS_TO, MEMBER_OF, OWNS, DEPENDS_ON)
3. **Customer Support Graph** — products, issues, fixes, KB articles (HAS_ISSUE, FIXED_BY, REFERENCES)
4. **Research Graph** — papers, authors, topics, citations (AUTHORED_BY, CITES, ABOUT)

## Live LLM mode (optional toggle)
- When ON, custom user questions are sent to an edge function that builds a prompt from the retrieved subgraph and streams an answer via Lovable AI (`google/gemini-3-flash-preview`)
- When OFF (default), only preloaded answers are shown for example questions; custom questions return a friendly "enable Live LLM to ask custom questions" message
- Errors (402/429) surfaced via toast

## State, undo/redo, persistence
- Central reducer-based store (zustand) with action history
- Tracked actions for undo/redo: change preset, edit question, ask question, change view settings (label toggle, retrieved-only), clear session
- `localStorage` keys: `grag.theme`, `grag.session`, `grag.recentQuestions`, `grag.notes`, `grag.progress`
- Reset button: clears current session state, returns to `/`, keeps presets and theme

## Design system
- Neutral palette (slate/zinc), single subtle accent for CTAs and highlighted graph nodes
- Generous spacing, 1px borders, soft shadows, rounded-xl cards
- Inter (or system) typography, clear hierarchy
- Focus rings everywhere; min 44px tap targets on mobile; high-contrast in both themes
- No gradients, no decorative noise

## Responsive behavior
- Desktop ≥1024px: 3-column grid (left 280px, center fluid, right 360px)
- Tablet 640–1023px: 2 columns (left collapses to a top accordion + tabs for graph/answer)
- Mobile <640px: stacked sections, sticky action bar at top with Undo/Redo/Reset/Theme, tab switcher for Graph / Answer / Sources

## Deliverables for first build
1. Tailwind theme + dark mode toggle wired with localStorage
2. Home route with hero, preset cards, "How it works"
3. Playground route with full 3-panel layout, force-directed graph, all 4 preloaded presets
4. Undo/redo store + Reset button
5. Side-by-side comparison + "Explain this result"
6. Live LLM toggle + edge function (`/chat`) using Lovable AI Gateway
7. Full responsive pass + a11y review (focus, contrast, keyboard nav)
