"use client";
import { useEffect, useRef } from "react";

// Ein weicher Lichtschein (Cyan/Magenta), der dem Mauszeiger folgt.
// Liegt hinter dem Inhalt, stört keine Klicks. Auf Touch-Geräten & bei
// "Bewegung reduzieren" deaktiviert.
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let x = tx, y = ty, raf = 0;
    function move(e: MouseEvent) { tx = e.clientX; ty = e.clientY; }
    function loop() {
      raf = requestAnimationFrame(loop);
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;      // sanftes Nachziehen
      if (el) el.style.transform = `translate(${x - 300}px, ${y - 300}px)`;
    }
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={ref} aria-hidden="true"
      style={{
        position: "fixed", top: 0, left: 0, width: 600, height: 600, zIndex: 0,
        pointerEvents: "none", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,240,255,0.10) 0%, rgba(255,43,214,0.06) 35%, transparent 70%)",
        filter: "blur(10px)",
      }} />
  );
}
