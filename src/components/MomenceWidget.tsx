import { useEffect, useRef } from "react";

type Attrs = Record<string, string>;

/**
 * Mounts a Momence plugin <script type="module"> tag inside a container.
 * Cleans up on unmount or when keys change so the widget can re-init.
 */
export function MomenceWidget({
  containerId,
  src,
  attrs,
  className,
}: {
  containerId: string;
  src: string;
  attrs: Attrs;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify({ src, attrs });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Clear any prior widget content (Momence renders into the sibling container)
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";

    const s = document.createElement("script");
    s.async = true;
    s.type = "module";
    s.src = src;
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    root.appendChild(s);

    return () => {
      try {
        root.removeChild(s);
      } catch {
        /* noop */
      }
      if (container) container.innerHTML = "";
    };
  }, [key, containerId, src]);

  return (
    <div className={className}>
      <div id={containerId} />
      <div ref={ref} />
    </div>
  );
}
