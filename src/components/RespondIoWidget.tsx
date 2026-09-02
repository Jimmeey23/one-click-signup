import { useEffect } from "react";

const SCRIPT_ID = "respondio__growth_tool";
const SRC = "https://cdn.respond.io/widget/widget.js?wId=a99c1d5b-93a4-4bc1-b1be-21bea2ece4b3";

// Selectors the respond.io widget injects outside the React tree. It renders
// straight into <body>, so unmount has to sweep these up by hand.
const WIDGET_NODES = '[id*="respond" i], [class*="respond" i], iframe[src*="respond.io" i]';

/**
 * Mounts the respond.io click-to-chat bubble. Deliberately NOT in the root
 * route: the widget must only appear after signup, on the classes page.
 */
export function RespondIoWidget() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SRC;
    script.async = true;
    script.addEventListener("error", () => {
      console.error("[debug:respondio] widget script failed to load (network/blocked/404)");
    });
    document.body.appendChild(script);

    const checkTimer = setTimeout(() => {
      const mounted = document.querySelector(WIDGET_NODES);
      if (!mounted) {
        console.warn(
          "[debug:respondio] script loaded but no widget UI detected - check the wId is active and this domain is allow-listed in the respond.io Growth Tool settings",
        );
      }
    }, 5000);

    return () => {
      clearTimeout(checkTimer);
      script.remove();
      for (const node of document.querySelectorAll(WIDGET_NODES)) node.remove();
    };
  }, []);

  return null;
}
