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
        canvas.width = Math.max(1, Math.floor(wrap.clientWidth * ratio));
        canvas.height = Math.max(1, Math.floor(wrap.clientHeight * ratio));
        canvas.style.width = `${wrap.clientWidth}px`;
        canvas.style.height = `${wrap.clientHeight}px`;

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
        {label && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
            {label}
          </p>
        )}
        <div
          ref={wrapRef}
          className="relative h-32 w-full rounded-md border border-input bg-background overflow-hidden touch-none"
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
            className="absolute bottom-1.5 right-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground bg-background/80 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Sign above with your finger, trackpad, stylus, or mouse.
        </p>
      </div>
    );
  },
);
