import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent } from "react";

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
  toRealSignature: () => string | null;
};

type Point = {
  x: number;
  y: number;
};

export const SignaturePad = forwardRef<SignaturePadHandle, { label?: string }>(
  function SignaturePad({ label }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef<Point | null>(null);
    const currentPathRef = useRef<number[] | null>(null);
    const pathsRef = useRef<number[][]>([]);
    const emptyRef = useRef(true);
    const [, setRenderTick] = useState(0);

    function getPoint(event: PointerEvent<HTMLCanvasElement>): Point {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      return {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      };
    }

    function getContext() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return null;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0F1419";
      ctx.lineWidth = 2.4;
      return ctx;
    }

    function clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pathsRef.current = [];
      currentPathRef.current = null;
      emptyRef.current = true;
      lastPointRef.current = null;
      setRenderTick((tick) => tick + 1);
    }

    useEffect(() => {
      function resize() {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;

        const ratio = window.devicePixelRatio || 1;
        // Read layout once before writing canvas dimensions.
        const width = wrap.clientWidth;
        const height = wrap.clientHeight;
        canvas.width = Math.max(1, Math.floor(width * ratio));
        canvas.height = Math.max(1, Math.floor(height * ratio));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
        pathsRef.current = [];
        currentPathRef.current = null;
        emptyRef.current = true;
        lastPointRef.current = null;
        setRenderTick((tick) => tick + 1);
      }

      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }, []);

    useImperativeHandle(ref, () => ({
      clear,
      isEmpty: () => emptyRef.current,
      toDataURL: () => {
        if (emptyRef.current) return null;
        return canvasRef.current?.toDataURL("image/png") ?? null;
      },
      toRealSignature: () => {
        if (emptyRef.current) return null;
        const paths = pathsRef.current.filter((path) => path.length >= 4);
        if (paths.length === 0) return null;
        return JSON.stringify(
          paths.map((path) => path.map((coordinate) => Number(coordinate.toFixed(4)))),
        );
      },
    }));

    function begin(event: PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      canvas?.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      const point = getPoint(event);
      const path = [point.x, point.y, point.x, point.y];
      pathsRef.current.push(path);
      currentPathRef.current = path;
      lastPointRef.current = point;
      emptyRef.current = false;
    }

    function draw(event: PointerEvent<HTMLCanvasElement>) {
      if (!drawingRef.current) return;
      const ctx = getContext();
      const last = lastPointRef.current;
      const next = getPoint(event);
      if (!ctx || !last) return;

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();

      currentPathRef.current?.push(next.x, next.y);
      lastPointRef.current = next;
      emptyRef.current = false;
    }

    function end(event: PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      drawingRef.current = false;
      lastPointRef.current = null;
      currentPathRef.current = null;
    }

    return (
      <div>
        {label && <p className="p57-label mb-1.5">{label}</p>}
        <div
          ref={wrapRef}
          className="relative h-32 w-full touch-none overflow-hidden rounded-[var(--radius-control)] border border-input bg-white"
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full cursor-crosshair"
            aria-label="Signature drawing area"
            onPointerDown={begin}
            onPointerMove={draw}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={(event) => {
              if (drawingRef.current) end(event);
            }}
          />
          <button
            type="button"
            onClick={clear}
            className="absolute bottom-2 right-2 rounded-full border border-border bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition hover:border-primary-deep hover:text-foreground"
          >
            Clear
          </button>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
          Sign above with your finger, trackpad, stylus, or mouse.
        </p>
      </div>
    );
  },
);
