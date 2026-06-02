import { useEffect, useState } from "react";

export function FlippingGallery({
  slots,
  intervalMs = 3500,
}: {
  // each slot is an array of image URLs that will cycle in that slot
  slots: string[][];
  intervalMs?: number;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4">
      {slots.map((imgs, idx) => {
        const offset = idx * 1;
        return (
          <div
            key={idx}
            className="relative aspect-[3/4] overflow-hidden bg-foreground"
          >
            {imgs.map((src, i) => {
              const active = i === (tick + offset) % imgs.length;
              return (
                <div
                  key={src}
                  className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-in-out"
                  style={{
                    backgroundImage: `url(${src})`,
                    opacity: active ? 1 : 0,
                  }}
                  aria-hidden
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
