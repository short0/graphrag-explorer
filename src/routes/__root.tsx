import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GraphRAG Playground" },
      {
        name: "description",
        content:
          "Interactive sandbox for learning GraphRAG: documents → entities → subgraph retrieval → grounded answers.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "GraphRAG Playground" },
      {
        property: "og:description",
        content: "Hands-on sandbox for learning GraphRAG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "GraphRAG Playground" },
      { name: "description", content: "Explore GraphRAG and graph databases with LLMs through interactive demos and a hands-on sandbox." },
      { property: "og:description", content: "Explore GraphRAG and graph databases with LLMs through interactive demos and a hands-on sandbox." },
      { name: "twitter:description", content: "Explore GraphRAG and graph databases with LLMs through interactive demos and a hands-on sandbox." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e861f161-2e13-463d-bad5-19f440a0358b/id-preview-a73b3de7--0b7afc28-4b30-48e9-969b-a7ff60024971.lovable.app-1776588122048.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e861f161-2e13-463d-bad5-19f440a0358b/id-preview-a73b3de7--0b7afc28-4b30-48e9-969b-a7ff60024971.lovable.app-1776588122048.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        // Apply theme before paint to avoid flash.
        children: `try{var t=localStorage.getItem('grag.theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
