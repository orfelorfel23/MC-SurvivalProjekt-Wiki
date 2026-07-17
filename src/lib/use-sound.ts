import { useCallback, useRef, useEffect } from "react";

export function useSound() {
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize lazily to avoid auto-play policy issues
    const init = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    window.addEventListener("click", init, { once: true });

    // Global click listener for sounds
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest("button") || target.closest("a");
      if (isInteractive) {
        playClick();
      }
    };
    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("click", init);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const playClick = useCallback(() => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;

    // Simple synthesized "click/pop" sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    // Quick pitch drop
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    // Quick fade out
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  return { playClick };
}
