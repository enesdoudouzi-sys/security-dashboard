"use client";
import { useEffect, useRef } from "react";

// Matrix-Regen im Hintergrund – grüne herabfallende Zeichen.
// Liegt hinter dem Inhalt (z-index -1), stört Texte nicht. Respektiert "Bewegung reduzieren".
export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const c = ref.current;
    if (!c) return;
    const canvas: HTMLCanvasElement = c;
    const g = canvas.getContext("2d");
    if (!g) return;
    const ctx: CanvasRenderingContext2D = g;

    const chars = "アイウエオカキクケコサシスセソ0123456789ABCDEF<>/\\$#@*".split("");
    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(0).map(() => Math.random() * -50);
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = 0;
    function draw(t: number) {
      raf = requestAnimationFrame(draw);
      if (t - last < 55) return;   // ~18 fps, ruhig & sparsam
      last = t;

      // leicht nachdunkeln → Schweif-Effekt
      ctx.fillStyle = "rgba(2, 6, 23, 0.10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        // Kopf der Spur heller, Rest grün
        ctx.fillStyle = Math.random() > 0.975 ? "rgba(167,243,208,0.9)" : "rgba(16,185,129,0.55)";
        ctx.fillText(text, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={ref} aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", opacity: 0.5 }} />
  );
}
