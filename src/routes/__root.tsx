import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import criticalCss from "virtual:p57-critical-css";

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

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
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
  head: ({ matches }) => {
    const landing = matches.some((match) => ["/", "/bengaluru"].includes(match.routeId as string));
    return {
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
        { property: "og:image", content: "/Physique57-800x600-1.jpg" },
        { name: "twitter:image", content: "/Physique57-800x600-1.jpg" },
      ],
      links: [
        { rel: "stylesheet", href: appCss, media: landing ? "print" : "all", id: "p57-full-css" },
        {
          rel: "preload",
          href: "/fonts/inter.woff2",
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
        {
          rel: "preload",
          href: landing ? "/fonts/hero-serif.woff2" : "/fonts/instrument-serif.woff2",
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
      ],
    };
  },
  scripts: () => {
    // The respond.io click-to-chat widget is intentionally absent here - it is
    // mounted per-route via <RespondIoWidget /> so it only shows post-signup.
    const scripts: Array<React.JSX.IntrinsicElements["script"]> = [
      {
        id: "stylesheet-loader",
        children: `var p57Css=document.getElementById('p57-full-css');if(p57Css&&p57Css.media==='print'){function p57ApplyCss(){p57Css.media='all';}if(p57Css.sheet){p57ApplyCss();}else{p57Css.addEventListener('load',p57ApplyCss,{once:true});p57Css.addEventListener('error',p57ApplyCss,{once:true});}}`,
      },
      {
        id: "tracker-scheduler",
        children: `window.p57LoadTracker=function(load,mode,maxWait){function schedule(){setTimeout(function(){if(window.requestIdleCallback){requestIdleCallback(load,{timeout:2000});}else{load();}},4500);}if(mode==='interaction'){var started=false;var events=['pointerdown','keydown','scroll'];function start(){if(started)return;started=true;events.forEach(function(event){window.removeEventListener(event,start);});if(window.requestIdleCallback){requestIdleCallback(load,{timeout:1000});}else{setTimeout(load,0);}}events.forEach(function(event){window.addEventListener(event,start,{once:true,passive:true});});if(maxWait){setTimeout(start,maxWait);}}else if(document.readyState==='complete'){schedule();}else{window.addEventListener('load',schedule,{once:true});}};`,
      },
    ];

    const gtmId = import.meta.env.VITE_GTM_ID?.trim();
    if (gtmId) {
      scripts.push({
        id: "gtm-init",
        children: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});window.p57LoadTracker(function(){(function(w,d,s,l,i){var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');},'interaction',12000);`,
      });
    }

    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
    const googleAdsId = import.meta.env.VITE_GOOGLE_ADS_ID?.trim();
    if (gaId || googleAdsId) {
      // GTM already supplies the Google tag and its linked destinations. Loading
      // gtag.js and configuring Ads here as well duplicates that work.
      // Keep GA configuration: this container owns Ads, not the GA destination.
      if (!gtmId)
        scripts.push({
          id: "gtag-loader",
          children: `window.p57LoadTracker(function(){var s=document.createElement("script");s.async=true;s.src=${JSON.stringify(`https://www.googletagmanager.com/gtag/js?id=${gaId || googleAdsId}`)};document.head.appendChild(s);},'interaction',12000);`,
        });
      const gtagConfigCalls = (gtmId ? [gaId] : [gaId, googleAdsId])
        .filter(Boolean)
        .map((id) => `gtag('config','${id}');`)
        .join("");
      scripts.push({
        id: "ga4-init",
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gtagConfigCalls}`,
      });
    }

    const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
    if (pixelId) {
      scripts.push({
        id: "meta-pixel-init",
        children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];window.p57LoadTracker(function(){t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);},'interaction',12000)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
      });
    }

    const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim();
    if (clarityProjectId) {
      scripts.push({
        id: "ms-clarity-init",
        // Record engaged sessions without running the recorder during first paint.
        // Set VITE_CLARITY_LOAD_MODE=load to retain passive-visit recordings.
        children: `window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};window.p57LoadTracker(function(){var s=document.createElement('script');s.async=true;s.src=${JSON.stringify(`https://www.clarity.ms/tag/${clarityProjectId}`)};document.head.appendChild(s);},${JSON.stringify(import.meta.env.VITE_CLARITY_LOAD_MODE === "load" ? "load" : "interaction")});`,
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const landing = pathname === "/" || pathname === "/bengaluru";
  return (
    <html lang="en">
      <head>
        {/* Keep critical CSS out of serialized route assets to avoid sending it twice. */}
        {landing ? <style id="p57-critical-css">{criticalCss}</style> : null}
        <HeadContent />
        <noscript>
          <link rel="stylesheet" href={appCss} />
        </noscript>
      </head>
      <body>
        {import.meta.env.VITE_GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${import.meta.env.VITE_GTM_ID?.trim()}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        ) : null}
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
