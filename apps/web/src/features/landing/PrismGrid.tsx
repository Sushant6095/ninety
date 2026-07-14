"use client";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motion as m } from "../../design/motion";

// Originkit "prism-grid" (BackgroundBoxes), re-skinned to Ninety: token-only colors (fills are up/lo
// tints via color-mix — no raw hex), hairline borders, framer runtime leftovers stripped, reduced
// motion → static lines (no fills, no travel). Landing close-section backdrop ONLY — a layout accent
// on the one rare surface with a delight budget; never near the tape (ui-craft §0/§7).

const PERSPECTIVE = 1000;
const FILLS = [
  "color-mix(in srgb, var(--up) 60%, transparent)",
  "color-mix(in srgb, var(--up) 34%, transparent)",
  "color-mix(in srgb, var(--up) 18%, transparent)",
  "color-mix(in srgb, var(--text-lo) 26%, transparent)",
  "color-mix(in srgb, var(--hairline) 85%, transparent)",
];
const OUT_S = 1; // fade-back, the one deliberately-slow beat (decorative decay, pointer-driven)

/** Invert the CSS 3D projection: map a screen point (relative to centre = perspective origin) onto the
 *  rotated plane. Browsers hit-test steeply tilted planes unreliably, so hover is resolved analytically. */
function screenToPlane(sx: number, sy: number, yawDeg: number, pitchDeg: number, p = PERSPECTIVE): { x: number; y: number } | null {
  const a = (yawDeg * Math.PI) / 180;
  const b = (pitchDeg * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const a11 = p * ca - sx * sa * cb;
  const a12 = sx * sb;
  const a21 = p * sa * sb - sy * sa * cb;
  const a22 = p * cb + sy * sb;
  const det = a11 * a22 - a12 * a21;
  if (!isFinite(det) || Math.abs(det) < 1e-6) return null; // edge-on: no hit
  const b1 = sx * p, b2 = sy * p;
  return { x: (b1 * a22 - a12 * b2) / det, y: (a11 * b2 - b1 * a21) / det };
}

interface Cell { id: number; row: number; col: number; color: string }

interface PrismGridProps {
  boxSize?: number;
  yaw?: number; // left/right sweep (CSS rotateY)
  pitch?: number; // front/back tilt (CSS rotateX)
  className?: string;
}

export function PrismGrid({ boxSize = 44, yaw = 0, pitch = 24, className = "" }: PrismGridProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(12);
  const [cols, setCols] = useState(32);
  const [lit, setLit] = useState<Cell | null>(null);
  const [fading, setFading] = useState<Cell[]>([]);
  const idRef = useRef(0);

  const calculateGrid = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCols(Math.max(1, Math.ceil((el.clientWidth || 1) / boxSize)));
    setRows(Math.max(1, Math.ceil((el.clientHeight || 1) / boxSize)));
  }, [boxSize]);

  useLayoutEffect(() => {
    calculateGrid();
    window.addEventListener("resize", calculateGrid);
    return () => window.removeEventListener("resize", calculateGrid);
  }, [calculateGrid]);

  const gridWidth = cols * boxSize;
  const gridHeight = rows * boxSize;
  const border = "1px solid color-mix(in srgb, var(--hairline) 55%, transparent)";

  const leave = useCallback(() => {
    setLit((current) => {
      if (current) setFading((f) => [...f, current]);
      return null;
    });
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduce) return; // reduced motion: static lines, no fills
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const point = screenToPlane(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2, yaw, pitch);
      if (!point) return leave();
      const col = Math.floor((point.x + gridWidth / 2) / boxSize);
      const row = Math.floor((point.y + gridHeight / 2) / boxSize);
      if (col < 0 || col >= cols || row < 0 || row >= rows) return leave();
      setLit((current) => {
        if (current && current.row === row && current.col === col) return current;
        if (current) setFading((f) => [...f, current]);
        return { id: ++idRef.current, row, col, color: FILLS[Math.floor(Math.random() * FILLS.length)] };
      });
    },
    [reduce, yaw, pitch, gridWidth, gridHeight, boxSize, cols, rows, leave],
  );

  useLayoutEffect(() => {
    if (fading.length === 0) return;
    const timer = setTimeout(() => setFading((f) => f.slice(1)), OUT_S * 1000);
    return () => clearTimeout(timer);
  }, [fading]);

  // The grid itself is static — no hover handlers, no motion components; it never re-renders on pointer moves.
  const boxes = useMemo(() => {
    return new Array(rows).fill(1).map((_, i) => (
      <div key={`row-${i}`} style={{ display: "flex", borderLeft: border, borderBottom: i === rows - 1 ? border : undefined }}>
        {new Array(cols).fill(1).map((_, j) => (
          <div key={`col-${j}`} style={{ width: boxSize, height: boxSize, flexShrink: 0, boxSizing: "border-box", borderRight: border, borderTop: border }} />
        ))}
      </div>
    ));
  }, [rows, cols, boxSize, border]);

  const cellStyle = (cell: Cell): CSSProperties => ({
    position: "absolute",
    left: cell.col * boxSize,
    top: cell.row * boxSize,
    width: boxSize,
    height: boxSize,
    backgroundColor: cell.color,
    pointerEvents: "none",
  });

  return (
    // Outer element clips only — it must NOT establish a 3D context (overflow:hidden + preserve-3d can't clip).
    <div
      ref={containerRef}
      aria-hidden
      onPointerMove={handlePointerMove}
      onPointerLeave={leave}
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      <div style={{ position: "absolute", inset: 0, perspective: `${PERSPECTIVE}px`, perspectiveOrigin: "center center", transformStyle: "preserve-3d" }}>
        <div
          style={{
            transform: `translate(-50%, -50%) rotateY(${yaw}deg) rotateX(${pitch}deg)`,
            position: "absolute",
            left: "50%",
            top: "50%",
            display: "flex",
            flexDirection: "column",
            transformOrigin: "center center",
            width: gridWidth,
            height: gridHeight,
          }}
        >
          {boxes}
          {fading.map((cell) => (
            <motion.div key={cell.id} initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: OUT_S, ease: m.easeOut }} style={cellStyle(cell)} />
          ))}
          {lit && <div key={lit.id} style={cellStyle(lit)} />}
        </div>
      </div>
    </div>
  );
}
