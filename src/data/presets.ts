export type EntityType =
  | "person"
  | "film"
  | "genre"
  | "employee"
  | "team"
  | "project"
  | "product"
  | "issue"
  | "fix"
  | "article"
  | "paper"
  | "topic";

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  description?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SourceDoc {
  id: string;
  title: string;
  text: string;
}

export interface PresetQuestion {
  id: string;
  question: string;
  graphAnswer: string;
  baselineAnswer: string;
  retrievedNodes: string[];
  retrievedEdges: string[];
  baselineChunks: string[]; // doc ids used as chunks
  explanation: string;
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  documents: SourceDoc[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  questions: PresetQuestion[];
}

// ---------- 1. Movies ----------
const movies: Preset = {
  id: "movies",
  title: "Movie Knowledge Graph",
  description: "Actors, directors, films, and genres connected by typed relationships.",
  documents: [
    {
      id: "m-d1",
      title: "Inception (2010)",
      text: "Inception is a science fiction film directed by Christopher Nolan, starring Leonardo DiCaprio and Joseph Gordon-Levitt. It belongs to the Sci-Fi and Thriller genres.",
    },
    {
      id: "m-d2",
      title: "The Dark Knight (2008)",
      text: "The Dark Knight is a superhero film directed by Christopher Nolan, starring Christian Bale and Heath Ledger. It belongs to the Action and Thriller genres.",
    },
    {
      id: "m-d3",
      title: "Titanic (1997)",
      text: "Titanic is a romantic disaster film directed by James Cameron, starring Leonardo DiCaprio and Kate Winslet. It belongs to the Romance and Drama genres.",
    },
    {
      id: "m-d4",
      title: "Interstellar (2014)",
      text: "Interstellar is a science fiction film directed by Christopher Nolan, starring Matthew McConaughey and Anne Hathaway. It belongs to the Sci-Fi and Drama genres.",
    },
  ],
  nodes: [
    { id: "nolan", label: "Christopher Nolan", type: "person", description: "Director" },
    { id: "cameron", label: "James Cameron", type: "person", description: "Director" },
    { id: "dicaprio", label: "Leonardo DiCaprio", type: "person", description: "Actor" },
    { id: "jgl", label: "Joseph Gordon-Levitt", type: "person", description: "Actor" },
    { id: "bale", label: "Christian Bale", type: "person", description: "Actor" },
    { id: "ledger", label: "Heath Ledger", type: "person", description: "Actor" },
    { id: "winslet", label: "Kate Winslet", type: "person", description: "Actress" },
    { id: "mcconaughey", label: "Matthew McConaughey", type: "person", description: "Actor" },
    { id: "hathaway", label: "Anne Hathaway", type: "person", description: "Actress" },
    { id: "inception", label: "Inception", type: "film" },
    { id: "tdk", label: "The Dark Knight", type: "film" },
    { id: "titanic", label: "Titanic", type: "film" },
    { id: "interstellar", label: "Interstellar", type: "film" },
    { id: "scifi", label: "Sci-Fi", type: "genre" },
    { id: "thriller", label: "Thriller", type: "genre" },
    { id: "action", label: "Action", type: "genre" },
    { id: "romance", label: "Romance", type: "genre" },
    { id: "drama", label: "Drama", type: "genre" },
  ],
  edges: [
    { id: "e1", source: "nolan", target: "inception", label: "DIRECTED" },
    { id: "e2", source: "nolan", target: "tdk", label: "DIRECTED" },
    { id: "e3", source: "nolan", target: "interstellar", label: "DIRECTED" },
    { id: "e4", source: "cameron", target: "titanic", label: "DIRECTED" },
    { id: "e5", source: "dicaprio", target: "inception", label: "ACTED_IN" },
    { id: "e6", source: "dicaprio", target: "titanic", label: "ACTED_IN" },
    { id: "e7", source: "jgl", target: "inception", label: "ACTED_IN" },
    { id: "e8", source: "bale", target: "tdk", label: "ACTED_IN" },
    { id: "e9", source: "ledger", target: "tdk", label: "ACTED_IN" },
    { id: "e10", source: "winslet", target: "titanic", label: "ACTED_IN" },
    { id: "e11", source: "mcconaughey", target: "interstellar", label: "ACTED_IN" },
    { id: "e12", source: "hathaway", target: "interstellar", label: "ACTED_IN" },
    { id: "e13", source: "inception", target: "scifi", label: "BELONGS_TO" },
    { id: "e14", source: "inception", target: "thriller", label: "BELONGS_TO" },
    { id: "e15", source: "tdk", target: "action", label: "BELONGS_TO" },
    { id: "e16", source: "tdk", target: "thriller", label: "BELONGS_TO" },
    { id: "e17", source: "titanic", target: "romance", label: "BELONGS_TO" },
    { id: "e18", source: "titanic", target: "drama", label: "BELONGS_TO" },
    { id: "e19", source: "interstellar", target: "scifi", label: "BELONGS_TO" },
    { id: "e20", source: "interstellar", target: "drama", label: "BELONGS_TO" },
  ],
  questions: [
    {
      id: "mq1",
      question: "Which Nolan films has Leonardo DiCaprio acted in?",
      graphAnswer:
        "Leonardo DiCaprio has acted in one Christopher Nolan film: Inception (2010). The graph shows DiCaprio ACTED_IN → Inception, and Nolan DIRECTED → Inception.",
      baselineAnswer:
        "Based on the documents, Leonardo DiCaprio appears in Inception, which was directed by Christopher Nolan. He also stars in Titanic, but that was directed by James Cameron.",
      retrievedNodes: ["dicaprio", "nolan", "inception"],
      retrievedEdges: ["e1", "e5"],
      baselineChunks: ["m-d1", "m-d3"],
      explanation:
        "GraphRAG traverses two edges: (DiCaprio)-[ACTED_IN]->(Inception)<-[DIRECTED]-(Nolan). It returns only films matching both constraints, so Titanic is correctly excluded without needing the model to filter.",
    },
    {
      id: "mq2",
      question: "What genres connect Inception and Interstellar?",
      graphAnswer:
        "Inception and Interstellar share the Sci-Fi genre. Both films have a BELONGS_TO edge pointing to Sci-Fi.",
      baselineAnswer:
        "Inception belongs to Sci-Fi and Thriller. Interstellar belongs to Sci-Fi and Drama. They share Sci-Fi.",
      retrievedNodes: ["inception", "interstellar", "scifi"],
      retrievedEdges: ["e13", "e19"],
      baselineChunks: ["m-d1", "m-d4"],
      explanation:
        "The subgraph is the intersection of genre edges from both films. The graph makes the shared neighbor (Sci-Fi) immediately visible.",
    },
    {
      id: "mq3",
      question: "Who acted in The Dark Knight?",
      graphAnswer: "Christian Bale and Heath Ledger acted in The Dark Knight.",
      baselineAnswer: "Christian Bale and Heath Ledger star in The Dark Knight.",
      retrievedNodes: ["tdk", "bale", "ledger"],
      retrievedEdges: ["e8", "e9"],
      baselineChunks: ["m-d2"],
      explanation:
        "A simple 1-hop traversal: find all (person)-[ACTED_IN]->(The Dark Knight). Both retrieval methods perform similarly here.",
    },
    {
      id: "mq4",
      question: "Which actors have worked with Christopher Nolan?",
      graphAnswer:
        "Five actors have worked with Christopher Nolan: Leonardo DiCaprio and Joseph Gordon-Levitt (Inception), Christian Bale and Heath Ledger (The Dark Knight), and Matthew McConaughey and Anne Hathaway (Interstellar).",
      baselineAnswer:
        "From the documents, Nolan directed Inception, The Dark Knight, and Interstellar. Their actors include DiCaprio, Gordon-Levitt, Bale, Ledger, McConaughey, and Hathaway.",
      retrievedNodes: [
        "nolan",
        "inception",
        "tdk",
        "interstellar",
        "dicaprio",
        "jgl",
        "bale",
        "ledger",
        "mcconaughey",
        "hathaway",
      ],
      retrievedEdges: ["e1", "e2", "e3", "e5", "e7", "e8", "e9", "e11", "e12"],
      baselineChunks: ["m-d1", "m-d2", "m-d4"],
      explanation:
        "A 2-hop query: (Nolan)-[DIRECTED]->(film)<-[ACTED_IN]-(actor). The graph aggregates results across all three films in a single traversal.",
    },
  ],
};

// ---------- 2. Company ----------
const company: Preset = {
  id: "company",
  title: "Company Org + Projects",
  description: "Employees, teams, managers, and project dependencies.",
  documents: [
    {
      id: "c-d1",
      title: "Engineering Org",
      text: "Alice manages the Platform team. Bob and Carol report to Alice. Dave manages the Web team. Eve and Frank report to Dave.",
    },
    {
      id: "c-d2",
      title: "Project Atlas",
      text: "Project Atlas is owned by the Platform team. It depends on Project Beacon. Bob is the lead engineer on Atlas.",
    },
    {
      id: "c-d3",
      title: "Project Beacon",
      text: "Project Beacon is owned by the Platform team. Carol is the lead. It is a foundational service.",
    },
    {
      id: "c-d4",
      title: "Project Comet",
      text: "Project Comet is owned by the Web team. It depends on Project Atlas. Eve leads Comet.",
    },
  ],
  nodes: [
    { id: "alice", label: "Alice", type: "employee", description: "Manager, Platform" },
    { id: "bob", label: "Bob", type: "employee", description: "Engineer" },
    { id: "carol", label: "Carol", type: "employee", description: "Engineer" },
    { id: "dave", label: "Dave", type: "employee", description: "Manager, Web" },
    { id: "eve", label: "Eve", type: "employee", description: "Engineer" },
    { id: "frank", label: "Frank", type: "employee", description: "Engineer" },
    { id: "platform", label: "Platform Team", type: "team" },
    { id: "web", label: "Web Team", type: "team" },
    { id: "atlas", label: "Project Atlas", type: "project" },
    { id: "beacon", label: "Project Beacon", type: "project" },
    { id: "comet", label: "Project Comet", type: "project" },
  ],
  edges: [
    { id: "c1", source: "bob", target: "alice", label: "REPORTS_TO" },
    { id: "c2", source: "carol", target: "alice", label: "REPORTS_TO" },
    { id: "c3", source: "eve", target: "dave", label: "REPORTS_TO" },
    { id: "c4", source: "frank", target: "dave", label: "REPORTS_TO" },
    { id: "c5", source: "alice", target: "platform", label: "MANAGES" },
    { id: "c6", source: "dave", target: "web", label: "MANAGES" },
    { id: "c7", source: "bob", target: "platform", label: "MEMBER_OF" },
    { id: "c8", source: "carol", target: "platform", label: "MEMBER_OF" },
    { id: "c9", source: "eve", target: "web", label: "MEMBER_OF" },
    { id: "c10", source: "frank", target: "web", label: "MEMBER_OF" },
    { id: "c11", source: "platform", target: "atlas", label: "OWNS" },
    { id: "c12", source: "platform", target: "beacon", label: "OWNS" },
    { id: "c13", source: "web", target: "comet", label: "OWNS" },
    { id: "c14", source: "atlas", target: "beacon", label: "DEPENDS_ON" },
    { id: "c15", source: "comet", target: "atlas", label: "DEPENDS_ON" },
    { id: "c16", source: "bob", target: "atlas", label: "LEADS" },
    { id: "c17", source: "carol", target: "beacon", label: "LEADS" },
    { id: "c18", source: "eve", target: "comet", label: "LEADS" },
  ],
  questions: [
    {
      id: "cq1",
      question: "If Project Beacon is delayed, which projects are affected?",
      graphAnswer:
        "Beacon delays cascade to Atlas (which depends on Beacon) and then to Comet (which depends on Atlas). Both downstream projects are at risk.",
      baselineAnswer:
        "Project Atlas depends on Project Beacon, so Atlas would be affected. Comet may also be affected since it depends on Atlas.",
      retrievedNodes: ["beacon", "atlas", "comet"],
      retrievedEdges: ["c14", "c15"],
      baselineChunks: ["c-d2", "c-d3", "c-d4"],
      explanation:
        "Multi-hop dependency traversal: Beacon ← Atlas ← Comet. The graph computes transitive impact in one query, while baseline RAG must reason across separate chunks.",
    },
    {
      id: "cq2",
      question: "Who reports to Alice?",
      graphAnswer: "Bob and Carol report to Alice.",
      baselineAnswer: "Bob and Carol report to Alice.",
      retrievedNodes: ["alice", "bob", "carol"],
      retrievedEdges: ["c1", "c2"],
      baselineChunks: ["c-d1"],
      explanation: "1-hop traversal on REPORTS_TO. Both methods get this right.",
    },
    {
      id: "cq3",
      question: "Which employees indirectly contribute to Project Comet?",
      graphAnswer:
        "Comet depends on Atlas, which depends on Beacon. So Bob (leads Atlas), Carol (leads Beacon), and Alice (manages the Platform team that owns both) all indirectly contribute, in addition to Eve who leads Comet directly.",
      baselineAnswer:
        "Eve leads Comet. Comet depends on Atlas (led by Bob). Atlas depends on Beacon (led by Carol). So Eve, Bob, and Carol contribute.",
      retrievedNodes: ["comet", "atlas", "beacon", "eve", "bob", "carol", "alice", "platform"],
      retrievedEdges: ["c14", "c15", "c16", "c17", "c18", "c5", "c11", "c12"],
      baselineChunks: ["c-d2", "c-d3", "c-d4"],
      explanation:
        "Combines DEPENDS_ON traversal with LEADS and MANAGES edges. The graph captures the full chain of contribution; baseline RAG often misses Alice.",
    },
  ],
};

// ---------- 3. Customer Support ----------
const support: Preset = {
  id: "support",
  title: "Customer Support Graph",
  description: "Products, issues, fixes, and linked knowledge articles.",
  documents: [
    {
      id: "s-d1",
      title: "Product: CloudSync",
      text: "CloudSync is our file synchronization product. Common issues include sync conflicts and slow uploads.",
    },
    {
      id: "s-d2",
      title: "Issue: Sync Conflicts",
      text: "Sync conflicts occur when the same file is edited on two devices offline. Fix: enable conflict resolution mode. See KB-101.",
    },
    {
      id: "s-d3",
      title: "Issue: Slow Uploads",
      text: "Slow uploads in CloudSync are usually caused by network throttling. Fix: use the bandwidth tuner. See KB-102.",
    },
    {
      id: "s-d4",
      title: "Product: MailPro",
      text: "MailPro is our email client. Known issues include missing attachments and login loops.",
    },
    {
      id: "s-d5",
      title: "Issue: Login Loops",
      text: "Login loops in MailPro occur when OAuth tokens expire. Fix: clear cached tokens. See KB-201.",
    },
  ],
  nodes: [
    { id: "cloudsync", label: "CloudSync", type: "product" },
    { id: "mailpro", label: "MailPro", type: "product" },
    { id: "issue-conflict", label: "Sync Conflicts", type: "issue" },
    { id: "issue-slow", label: "Slow Uploads", type: "issue" },
    { id: "issue-attach", label: "Missing Attachments", type: "issue" },
    { id: "issue-login", label: "Login Loops", type: "issue" },
    { id: "fix-resolution", label: "Enable conflict resolution", type: "fix" },
    { id: "fix-tuner", label: "Use bandwidth tuner", type: "fix" },
    { id: "fix-tokens", label: "Clear cached tokens", type: "fix" },
    { id: "kb-101", label: "KB-101", type: "article" },
    { id: "kb-102", label: "KB-102", type: "article" },
    { id: "kb-201", label: "KB-201", type: "article" },
  ],
  edges: [
    { id: "s1", source: "cloudsync", target: "issue-conflict", label: "HAS_ISSUE" },
    { id: "s2", source: "cloudsync", target: "issue-slow", label: "HAS_ISSUE" },
    { id: "s3", source: "mailpro", target: "issue-attach", label: "HAS_ISSUE" },
    { id: "s4", source: "mailpro", target: "issue-login", label: "HAS_ISSUE" },
    { id: "s5", source: "issue-conflict", target: "fix-resolution", label: "FIXED_BY" },
    { id: "s6", source: "issue-slow", target: "fix-tuner", label: "FIXED_BY" },
    { id: "s7", source: "issue-login", target: "fix-tokens", label: "FIXED_BY" },
    { id: "s8", source: "fix-resolution", target: "kb-101", label: "REFERENCES" },
    { id: "s9", source: "fix-tuner", target: "kb-102", label: "REFERENCES" },
    { id: "s10", source: "fix-tokens", target: "kb-201", label: "REFERENCES" },
  ],
  questions: [
    {
      id: "sq1",
      question: "How do I fix sync conflicts in CloudSync?",
      graphAnswer:
        "Enable conflict resolution mode. See KB-101 for full steps. (Path: CloudSync → Sync Conflicts → Enable conflict resolution → KB-101.)",
      baselineAnswer:
        "Enable conflict resolution mode. KB-101 has the details.",
      retrievedNodes: ["cloudsync", "issue-conflict", "fix-resolution", "kb-101"],
      retrievedEdges: ["s1", "s5", "s8"],
      baselineChunks: ["s-d2"],
      explanation:
        "The graph chains product → issue → fix → article in a single traversal, returning the canonical KB link automatically.",
    },
    {
      id: "sq2",
      question: "What known issues affect MailPro and what KB articles cover them?",
      graphAnswer:
        "MailPro has Missing Attachments and Login Loops. Login Loops are fixed by Clear cached tokens (see KB-201). Missing Attachments has no recorded fix yet.",
      baselineAnswer:
        "MailPro has missing attachments and login loops. Login loops are fixed by clearing cached tokens (KB-201).",
      retrievedNodes: ["mailpro", "issue-attach", "issue-login", "fix-tokens", "kb-201"],
      retrievedEdges: ["s3", "s4", "s7", "s10"],
      baselineChunks: ["s-d4", "s-d5"],
      explanation:
        "The subgraph clearly surfaces that one issue lacks a FIXED_BY edge — a structural gap a chunk-based answer might gloss over.",
    },
    {
      id: "sq3",
      question: "List every KB article reachable from CloudSync.",
      graphAnswer: "KB-101 (sync conflicts) and KB-102 (slow uploads).",
      baselineAnswer: "KB-101 and KB-102 are referenced in the CloudSync issue docs.",
      retrievedNodes: [
        "cloudsync",
        "issue-conflict",
        "issue-slow",
        "fix-resolution",
        "fix-tuner",
        "kb-101",
        "kb-102",
      ],
      retrievedEdges: ["s1", "s2", "s5", "s6", "s8", "s9"],
      baselineChunks: ["s-d1", "s-d2", "s-d3"],
      explanation:
        "A 3-hop reachability query (Product → Issue → Fix → Article). The graph computes the closure exhaustively.",
    },
  ],
};

// ---------- 4. Research ----------
const research: Preset = {
  id: "research",
  title: "Research Graph",
  description: "Papers, authors, topics, and citation links.",
  documents: [
    {
      id: "r-d1",
      title: "Paper: Attention Is All You Need (2017)",
      text: "Vaswani et al. introduce the Transformer architecture, foundational to modern NLP. Topic: deep learning.",
    },
    {
      id: "r-d2",
      title: "Paper: BERT (2018)",
      text: "Devlin et al. propose BERT, a bidirectional transformer model for language understanding. Cites Attention Is All You Need. Topic: NLP.",
    },
    {
      id: "r-d3",
      title: "Paper: GPT-3 (2020)",
      text: "Brown et al. describe GPT-3, a 175B parameter language model. Cites Attention Is All You Need. Topic: NLP.",
    },
    {
      id: "r-d4",
      title: "Paper: GraphRAG (2024)",
      text: "Edge et al. propose GraphRAG, combining knowledge graphs with retrieval-augmented generation. Cites BERT and GPT-3. Topics: NLP, knowledge graphs.",
    },
  ],
  nodes: [
    { id: "p-attn", label: "Attention Is All You Need", type: "paper" },
    { id: "p-bert", label: "BERT", type: "paper" },
    { id: "p-gpt3", label: "GPT-3", type: "paper" },
    { id: "p-grag", label: "GraphRAG", type: "paper" },
    { id: "a-vaswani", label: "Vaswani", type: "person" },
    { id: "a-devlin", label: "Devlin", type: "person" },
    { id: "a-brown", label: "Brown", type: "person" },
    { id: "a-edge", label: "Edge", type: "person" },
    { id: "t-dl", label: "Deep Learning", type: "topic" },
    { id: "t-nlp", label: "NLP", type: "topic" },
    { id: "t-kg", label: "Knowledge Graphs", type: "topic" },
  ],
  edges: [
    { id: "r1", source: "p-attn", target: "a-vaswani", label: "AUTHORED_BY" },
    { id: "r2", source: "p-bert", target: "a-devlin", label: "AUTHORED_BY" },
    { id: "r3", source: "p-gpt3", target: "a-brown", label: "AUTHORED_BY" },
    { id: "r4", source: "p-grag", target: "a-edge", label: "AUTHORED_BY" },
    { id: "r5", source: "p-bert", target: "p-attn", label: "CITES" },
    { id: "r6", source: "p-gpt3", target: "p-attn", label: "CITES" },
    { id: "r7", source: "p-grag", target: "p-bert", label: "CITES" },
    { id: "r8", source: "p-grag", target: "p-gpt3", label: "CITES" },
    { id: "r9", source: "p-attn", target: "t-dl", label: "ABOUT" },
    { id: "r10", source: "p-bert", target: "t-nlp", label: "ABOUT" },
    { id: "r11", source: "p-gpt3", target: "t-nlp", label: "ABOUT" },
    { id: "r12", source: "p-grag", target: "t-nlp", label: "ABOUT" },
    { id: "r13", source: "p-grag", target: "t-kg", label: "ABOUT" },
  ],
  questions: [
    {
      id: "rq1",
      question: "What papers transitively build on Attention Is All You Need?",
      graphAnswer:
        "BERT and GPT-3 cite Attention directly. GraphRAG cites both BERT and GPT-3, so it transitively builds on Attention as well.",
      baselineAnswer:
        "BERT cites Attention Is All You Need. GPT-3 also cites it. GraphRAG cites BERT and GPT-3.",
      retrievedNodes: ["p-attn", "p-bert", "p-gpt3", "p-grag"],
      retrievedEdges: ["r5", "r6", "r7", "r8"],
      baselineChunks: ["r-d1", "r-d2", "r-d3", "r-d4"],
      explanation:
        "Multi-hop CITES traversal computes the full ancestor closure. The graph naturally answers 'transitively' queries that confuse chunk retrieval.",
    },
    {
      id: "rq2",
      question: "Which authors work on NLP?",
      graphAnswer:
        "Devlin (BERT), Brown (GPT-3), and Edge (GraphRAG) all author papers tagged with the NLP topic.",
      baselineAnswer:
        "BERT, GPT-3, and GraphRAG are NLP papers, authored by Devlin, Brown, and Edge respectively.",
      retrievedNodes: ["t-nlp", "p-bert", "p-gpt3", "p-grag", "a-devlin", "a-brown", "a-edge"],
      retrievedEdges: ["r10", "r11", "r12", "r2", "r3", "r4"],
      baselineChunks: ["r-d2", "r-d3", "r-d4"],
      explanation:
        "(Topic:NLP)<-[ABOUT]-(paper)-[AUTHORED_BY]->(author). A 2-hop join the graph executes natively.",
    },
    {
      id: "rq3",
      question: "What topics does GraphRAG combine?",
      graphAnswer: "GraphRAG is about NLP and Knowledge Graphs.",
      baselineAnswer: "GraphRAG combines NLP and Knowledge Graphs.",
      retrievedNodes: ["p-grag", "t-nlp", "t-kg"],
      retrievedEdges: ["r12", "r13"],
      baselineChunks: ["r-d4"],
      explanation: "Simple 1-hop ABOUT lookup. Both methods perform similarly.",
    },
  ],
};

export const PRESETS: Preset[] = [movies, company, support, research];

export function getPreset(id: string | undefined): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
