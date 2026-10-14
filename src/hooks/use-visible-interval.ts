import { useEffect, useRef, type RefObject } from "react";

// Carousels should animate only while someone can see them. Keep their current
// position when hidden, and honor both OS motion preferences and tab visibility.
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
    const update = () => {
      const active = visible && !document.hidden && !motion.matches;
      if (active && !timer) timer = setInterval(() => callbackRef.current(), delay);
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
    motion.addEventListener("change", update);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, [ref, delay, enabled]);
}
