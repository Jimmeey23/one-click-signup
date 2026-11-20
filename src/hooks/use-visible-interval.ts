import { useEffect, useRef, type RefObject } from "react";

// Carousels should animate only while someone can see them. Keep their current
// position when hidden and pause in background tabs. Reduced motion slows the rotation
// rather than stopping it, so a carousel never looks frozen.
export function useVisibleInterval(
  ref: RefObject<Element | null>,
  callback: () => void,
  delay: number,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const restart = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
      update();
    };
    const update = () => {
      const active = visible && !document.hidden;
      if (active && !timer)
        timer = setInterval(() => callbackRef.current(), motion.matches ? delay * 1.6 : delay);
      if (!active && timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", restart);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", restart);
    };
  }, [ref, delay, enabled]);
}
