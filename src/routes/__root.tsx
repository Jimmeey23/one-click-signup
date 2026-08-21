import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Physique 57 India - Barre Sign up" },
      {
        name: "description",
        content: "Discover Physique 57 India studios, signature classes, and booking options.",
      },
      { property: "og:title", content: "Physique 57 India - Barre Sign up" },
      {
        property: "og:description",
        content: "Discover Physique 57 India studios, signature classes, and booking options.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Physique 57 India - Barre Sign up" },
      {
        name: "twitter:description",
        content: "Discover Physique 57 India studios, signature classes, and booking options.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3a668fa8-2615-469d-a5e7-77e96e2c32b8/id-preview-d8de624d--2f4e0b0e-31c3-4143-a84b-4ddac40ad6e2.lovable.app-1780395324402.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3a668fa8-2615-469d-a5e7-77e96e2c32b8/id-preview-d8de624d--2f4e0b0e-31c3-4143-a84b-4ddac40ad6e2.lovable.app-1780395324402.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  scripts: () => {
    const scripts: Array<React.JSX.IntrinsicElements["script"]> = [
      {
        id: "respondio__growth_tool",
        src: "https://cdn.respond.io/widget/widget.js?wId=a99c1d5b-93a4-4bc1-b1be-21bea2ece4b3",
      },
    ];

    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId) {
      scripts.push({ src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true });
      scripts.push({
        id: "ga4-init",
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
      });
    }

    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (pixelId) {
      scripts.push({
        id: "meta-pixel-init",
        children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
      });
    }

    return scripts;
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const script = document.getElementById("respondio__growth_tool") as HTMLScriptElement | null;
    console.debug("[debug:respondio] script tag present:", !!script, script?.src);
    if (!script) {
      console.error("[debug:respondio] widget script tag missing from DOM");
      return;
    }
    script.addEventListener("error", () => {
      console.error("[debug:respondio] widget script failed to load (network/blocked/404)");
    });

    const checkTimer = setTimeout(() => {
      const mounted = document.querySelector(
        '[id*="respond" i], [class*="respond" i], iframe[src*="respond.io" i]',
      );
      console.debug("[debug:respondio] widget UI element found after 5s:", !!mounted);
      if (!mounted) {
        console.warn(
          "[debug:respondio] script loaded but no widget UI detected - check the wId is active and this domain is allow-listed in the respond.io Growth Tool settings",
        );
      }
    }, 5000);

    return () => clearTimeout(checkTimer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
