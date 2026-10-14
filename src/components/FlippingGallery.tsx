import { useRef, useState } from "react";
import { useVisibleInterval } from "@/hooks/use-visible-interval";

export function FlippingGallery({
  slots,
  intervalMs = 3500,
}: {
  slots: string[][];
  intervalMs?: number;
}) {
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLElement>(null);
  useVisibleInterval(ref, () => setTick((value) => value + 1), intervalMs);

  return (
    <section
      ref={ref}
      aria-label="Studio gallery"
      className="gallery-frame relative grid grid-cols-2 gap-px bg-white/20 p-px md:grid-cols-4"
    >
      {slots.map((images, index) => (
        <div key={index} className="group relative aspect-[3/4] overflow-hidden bg-foreground">
          {images.map((src, imageIndex) => {
            const active = imageIndex === (tick + index) % images.length;
            // Mount only the current photo; hidden background images otherwise all download at startup.
            return active ? (
              <img
                key={src}
                src={src}
                alt=""
                width={900}
                height={1200}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.025]"
              />
            ) : null;
          })}
        </div>
      ))}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
        aria-hidden
      />
    </section>
  );
}
