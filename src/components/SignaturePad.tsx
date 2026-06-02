import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import SignatureCanvas from "react-signature-canvas";

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
};

export const SignaturePad = forwardRef<SignaturePadHandle, { label?: string }>(
  function SignaturePad({ label }, ref) {
    const padRef = useRef<SignatureCanvas | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [, setTick] = useState(0);

    // Make canvas crisp by sizing to its parent box
    useEffect(() => {
      const resize = () => {
        const wrap = wrapRef.current;
        const pad = padRef.current;
        if (!wrap || !pad) return;
        const canvas = pad.getCanvas();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = wrap.clientWidth * ratio;
        canvas.height = wrap.clientHeight * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.scale(ratio, ratio);
        pad.clear();
        setTick((t) => t + 1);
      };
      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => padRef.current?.clear(),
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      toDataURL: () => padRef.current?.toDataURL("image/png") ?? null,
    }));

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
          <SignatureCanvas
            ref={(r) => {
              padRef.current = r;
            }}
            penColor="#0F1419"
            canvasProps={{ className: "w-full h-full block" }}
          />
          <button
            type="button"
            onClick={() => padRef.current?.clear()}
            className="absolute bottom-1.5 right-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground bg-background/80 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Sign above with your finger or mouse.
        </p>
      </div>
    );
  },
);
