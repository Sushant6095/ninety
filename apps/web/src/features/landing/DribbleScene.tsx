"use client";
import { useEffect, useRef, useState } from "react";
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, Color, Vector3,
  CapsuleGeometry, SphereGeometry, CylinderGeometry, PlaneGeometry, BufferGeometry, BufferAttribute,
  MeshBasicMaterial, LineBasicMaterial, LineSegments, Line, Sprite, SpriteMaterial,
  CatmullRomCurve3, CanvasTexture, AdditiveBlending,
} from "three";
import { resolveColor } from "../../design/tokens";

// The 3D football moment (ADR-070): a stylized #10 weaves past four defenders, beats the last man,
// and scores — the net ripples, the scene flashes green, and the price chip ticks 41.0 → 61.4 (the
// same repricing story the hero and the loop tell). LANDING ONLY (ADR-058) — never /terminal, never
// the board. STYLIZED BY DESIGN: abstract glowing figures on a dark token pitch (Mixamo's rigged
// clips need an interactive Adobe login, and elegant/abstract outperforms photoreal here anyway).
// House 3D discipline (WorldGlobe pattern): vanilla three, MeshBasicMaterial only (no lights),
// resolveColor tokens (canvas can't read var()), DPR ≤ 1.5, rAF ONLY while IO-visible, full dispose.
// Reduced motion → one static frame at the goal, no loop.

const LOOP = 7.6; // seconds of story time
const SHOT_START = 4.8, SHOT_END = 5.45; // phase boundaries (story seconds)
const SLOWMO = 0.38; // time-scale during the shot window
const GOAL_X = 5.8, CORNER = new Vector3(5.78, 0.72, 0.82); // goal line + far top corner

// The run: a weave that cuts around each defender in turn, ending at the shot point.
const WEAVE = [
  new Vector3(-5.4, 0, -0.8), new Vector3(-4.0, 0, 0.7), new Vector3(-2.6, 0, -1.2),
  new Vector3(-1.2, 0, 1.1), new Vector3(0.4, 0, -1.3), new Vector3(1.9, 0, 0.8),
  new Vector3(3.2, 0, -0.2),
];
// Defender stations sit on the inside of each cut; u = where the dribbler passes them.
const DEFENDERS = [
  { pos: new Vector3(-4.1, 0, -0.15), u: 0.16 }, { pos: new Vector3(-2.5, 0, 0.15), u: 0.34 },
  { pos: new Vector3(-1.1, 0, -0.15), u: 0.52 }, { pos: new Vector3(0.55, 0, 0.2), u: 0.7 },
];

function glowTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

/** One stylized figure: capsule body + head. Returned group sits with feet on y=0. */
function makeFigure(body: MeshBasicMaterial, head: MeshBasicMaterial, bodyGeo: CapsuleGeometry, headGeo: SphereGeometry): Group {
  const g = new Group();
  const torso = new Mesh(bodyGeo, body);
  torso.position.y = 0.38;
  const dome = new Mesh(headGeo, head);
  dome.position.y = 0.8;
  g.add(torso, dome);
  return g;
}

export function DribbleScene({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [price, setPrice] = useState("41.0");
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── tokens, resolved once (canvas can't read var(); values come from tokens.css — no raw hex here)
    const col = {
      bg: new Color(resolveColor("bg") || undefined),
      hairline: new Color(resolveColor("hairline") || undefined),
      up: new Color(resolveColor("up") || undefined),
      hi: new Color(resolveColor("textHi") || undefined),
      lo: new Color(resolveColor("textLo") || undefined),
    };

    const scene = new Scene();
    const w = container.clientWidth || 640;
    const h = container.clientHeight || 420;
    const camera = new PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(-2.2, 2.1, 4.8);
    camera.lookAt(-1, 0.3, 0);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    // ── pitch: dark plane + up-token line markings (touchline, halfway, centre circle, the box)
    const pitch = new Mesh(new PlaneGeometry(13.2, 7.6), new MeshBasicMaterial({ color: col.bg }));
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);
    const lp: number[] = [];
    const seg = (a: Vector3, b: Vector3) => lp.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const Y = 0.005;
    seg(new Vector3(-6.2, Y, -3.4), new Vector3(6.2, Y, -3.4));
    seg(new Vector3(-6.2, Y, 3.4), new Vector3(6.2, Y, 3.4));
    seg(new Vector3(-6.2, Y, -3.4), new Vector3(-6.2, Y, 3.4));
    seg(new Vector3(6.2, Y, -3.4), new Vector3(6.2, Y, 3.4));
    seg(new Vector3(-1.5, Y, -3.4), new Vector3(-1.5, Y, 3.4)); // halfway (shifted — we attack right)
    for (let i = 0; i < 40; i++) { // centre circle
      const a = (i / 40) * Math.PI * 2, b = ((i + 1) / 40) * Math.PI * 2, r = 0.9;
      seg(new Vector3(-1.5 + Math.cos(a) * r, Y, Math.sin(a) * r), new Vector3(-1.5 + Math.cos(b) * r, Y, Math.sin(b) * r));
    }
    seg(new Vector3(4.4, Y, -1.9), new Vector3(4.4, Y, 1.9)); // the box
    seg(new Vector3(4.4, Y, -1.9), new Vector3(6.2, Y, -1.9));
    seg(new Vector3(4.4, Y, 1.9), new Vector3(6.2, Y, 1.9));
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", new BufferAttribute(new Float32Array(lp), 3));
    const lineMat = new LineBasicMaterial({ color: col.up, transparent: true, opacity: 0.22 });
    scene.add(new LineSegments(lineGeo, lineMat));

    // ── goal: posts + crossbar (hi token) + a rippling net grid behind the line
    const postGeo = new CylinderGeometry(0.03, 0.03, 0.92, 8);
    const barGeo = new CylinderGeometry(0.03, 0.03, 2.26, 8);
    const frameMat = new MeshBasicMaterial({ color: col.hi });
    const postL = new Mesh(postGeo, frameMat); postL.position.set(GOAL_X, 0.46, -1.1);
    const postR = new Mesh(postGeo, frameMat); postR.position.set(GOAL_X, 0.46, 1.1);
    const bar = new Mesh(barGeo, frameMat); bar.rotation.x = Math.PI / 2; bar.position.set(GOAL_X, 0.92, 0);
    scene.add(postL, postR, bar);
    const NX = 9, NY = 6; // net grid nodes
    const netBase: Vector3[] = [];
    for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++)
      netBase.push(new Vector3(GOAL_X + 0.22, (iy / (NY - 1)) * 0.9, -1.1 + (ix / (NX - 1)) * 2.2));
    const netIdx: number[] = [];
    for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX; ix++) {
      const i = iy * NX + ix;
      if (ix < NX - 1) netIdx.push(i, i + 1);
      if (iy < NY - 1) netIdx.push(i, i + NX);
    }
    const netPos = new Float32Array(netIdx.length * 3);
    const netGeo = new BufferGeometry();
    netGeo.setAttribute("position", new BufferAttribute(netPos, 3));
    const netMat = new LineBasicMaterial({ color: col.lo, transparent: true, opacity: 0.5 });
    const net = new LineSegments(netGeo, netMat);
    scene.add(net);
    let rippleT = -1; // <0 = calm; else seconds since impact
    const writeNet = () => {
      for (let k = 0; k < netIdx.length; k++) {
        const p = netBase[netIdx[k]!]!;
        let x = p.x;
        if (rippleT >= 0 && rippleT < 0.8) {
          const d = Math.hypot(p.y - CORNER.y, p.z - CORNER.z);
          x += Math.sin(rippleT * 22 - d * 6) * 0.14 * Math.exp(-d * 1.6) * Math.exp(-rippleT * 3.2);
        }
        netPos[k * 3] = x; netPos[k * 3 + 1] = p.y; netPos[k * 3 + 2] = p.z;
      }
      netGeo.attributes.position!.needsUpdate = true;
    };
    writeNet();

    // ── figures: shared geometries, per-role materials (unlit — the dark stylized look)
    const bodyGeo = new CapsuleGeometry(0.16, 0.42, 4, 12);
    const headGeo = new SphereGeometry(0.125, 16, 12);
    const upMat = new MeshBasicMaterial({ color: col.up });
    const hiMat = new MeshBasicMaterial({ color: col.hi });
    const defMat = new MeshBasicMaterial({ color: col.hairline });
    const defHeadMat = new MeshBasicMaterial({ color: col.lo });
    const dribbler = makeFigure(upMat, hiMat, bodyGeo, headGeo);
    scene.add(dribbler);
    const defenders = DEFENDERS.map((d) => {
      const f = makeFigure(defMat, defHeadMat, bodyGeo, headGeo);
      f.position.copy(d.pos);
      scene.add(f);
      return f;
    });
    const keeper = makeFigure(defMat, defHeadMat, bodyGeo, headGeo);
    keeper.position.set(5.45, 0, 0);
    scene.add(keeper);

    // ── ball + glows + shot trail
    const ball = new Mesh(new SphereGeometry(0.085, 16, 12), new MeshBasicMaterial({ color: col.hi }));
    scene.add(ball);
    const glowTex = glowTexture();
    const mkGlow = (size: number, opacity: number) => {
      const s = new Sprite(new SpriteMaterial({ map: glowTex, color: col.up, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false }));
      s.scale.setScalar(size);
      return s;
    };
    const feetGlow = mkGlow(0.9, 0.35);
    scene.add(feetGlow);
    const flash = mkGlow(0.2, 0);
    flash.position.copy(CORNER);
    scene.add(flash);
    const TRAIL_N = 12;
    const trailPos = new Float32Array(TRAIL_N * 3);
    const trailGeo = new BufferGeometry();
    trailGeo.setAttribute("position", new BufferAttribute(trailPos, 3));
    const trailMat = new LineBasicMaterial({ color: col.up, transparent: true, opacity: 0 });
    const trail = new Line(trailGeo, trailMat);
    scene.add(trail);

    const curve = new CatmullRomCurve3(WEAVE);
    // preallocated scratch vectors (no per-frame allocs — MotionScore law)
    const pos = new Vector3(), tan = new Vector3(), look = new Vector3(), camT = new Vector3(), scratch = new Vector3();

    // ── the story clock: real dt → story time, slow-mo through the shot window
    let s = 0, goalFired = false;
    const easeU = (x: number) => x * x * (3 - 2 * x); // smoothstep — accelerate into the run, settle at the shot
    const step = (dt: number) => {
      s += dt * (s >= SHOT_START && s < SHOT_END ? SLOWMO : 1);
      if (s >= LOOP) { // reset the loop
        s %= LOOP; goalFired = false; rippleT = -1;
        flash.material.opacity = 0;
        trailMat.opacity = 0;
        keeper.position.set(5.45, 0, 0); keeper.rotation.set(0, 0, 0);
        defenders.forEach((f, i) => { f.position.copy(DEFENDERS[i]!.pos); f.rotation.set(0, 0, 0); });
        setPrice("41.0");
      }

      // dribbler along the weave (holds his follow-through spot after the shot)
      const u = easeU(Math.min(s, SHOT_START) / SHOT_START);
      curve.getPointAt(u, pos);
      curve.getTangentAt(u, tan);
      const bob = s < SHOT_START ? Math.abs(Math.sin(s * 9)) * 0.03 : 0;
      dribbler.position.set(pos.x, bob, pos.z);
      look.copy(pos).add(tan);
      look.y = bob;
      dribbler.lookAt(look);
      dribbler.rotation.x += 0.1; // forward running lean
      feetGlow.position.set(pos.x, 0.06, pos.z);

      // the ball: at his feet through the run, then the strike
      if (s < SHOT_START) {
        const touch = Math.abs(Math.sin(s * 10.5));
        ball.position.set(pos.x + tan.x * 0.26, 0.085 + touch * 0.06, pos.z + tan.z * 0.26);
      } else if (s < SHOT_END) {
        const k = (s - SHOT_START) / (SHOT_END - SHOT_START);
        const from = scratch.set(WEAVE[6]!.x + 0.26, 0.085, WEAVE[6]!.z);
        ball.position.lerpVectors(from, CORNER, k);
        ball.position.y += Math.sin(k * Math.PI) * 0.22; // slight arc
        // trail: shift history back, head at the ball
        for (let i = TRAIL_N - 1; i > 0; i--) {
          trailPos[i * 3] = trailPos[(i - 1) * 3]!; trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1]!; trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2]!;
        }
        trailPos[0] = ball.position.x; trailPos[1] = ball.position.y; trailPos[2] = ball.position.z;
        trailGeo.attributes.position!.needsUpdate = true;
        trailMat.opacity = 0.55;
        // keeper dives — the wrong way
        const dive = Math.min(1, k * 1.6);
        keeper.position.set(5.45, dive * 0.1, -dive * 0.75);
        keeper.rotation.x = -dive * 1.15;
      } else {
        // GOAL: the net takes it, the flash fires, the price ticks up, the ball settles
        if (!goalFired) {
          goalFired = true; rippleT = 0;
          setPrice("61.4"); setFlashKey((n) => n + 1);
        }
        const k = Math.min(1, (s - SHOT_END) / 0.5);
        ball.position.set(CORNER.x + 0.15, Math.max(0.085, CORNER.y * (1 - k)), CORNER.z);
        flash.material.opacity = Math.max(0, 0.9 - (s - SHOT_END) * 1.4);
        flash.scale.setScalar(0.2 + (s - SHOT_END) * 3.2);
        trailMat.opacity = Math.max(0, 0.55 - (s - SHOT_END) * 1.2);
      }
      if (rippleT >= 0) { rippleT += dt; writeNet(); if (rippleT >= 0.85) { rippleT = -1; writeNet(); } }

      // defenders: lunge as he arrives, beaten (tilted, left behind) once he's past
      defenders.forEach((f, i) => {
        const d = DEFENDERS[i]!;
        const gap = u - d.u;
        if (gap < 0 && gap > -0.09) {
          const a = 1 - -gap / 0.09;
          f.lookAt(scratch.set(dribbler.position.x, 0, dribbler.position.z));
          f.rotation.x += a * 0.3; // lunging lean
          f.position.lerpVectors(d.pos, scratch.set(d.pos.x, 0, d.pos.z + (pos.z > d.pos.z ? 0.18 : -0.18)), a);
        } else if (gap >= 0) {
          const beaten = Math.min(1, gap / 0.05);
          f.rotation.z = (d.pos.z > pos.z ? 1 : -1) * beaten * 0.42; // wrong-footed tilt
        }
      });

      // camera: track the run, then settle low behind the shot
      if (s < SHOT_START) {
        camT.set(pos.x * 0.5 - 1.4, 2.05, 4.7);
        look.set(pos.x + 1.1, 0.28, 0);
      } else {
        camT.set(1.7, 1.0, 3.7);
        look.copy(ball.position);
      }
      camera.position.lerp(camT, 0.055);
      scratch.copy(look);
      camera.lookAt(scratch);
    };

    // ── frame pump: rAF ONLY while IO-visible (house rule); reduced motion → one goal frame
    let raf = 0, visible = false, last = 0;
    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      step(dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && visible && !disposed) { last = 0; raf = requestAnimationFrame(frame); } };

    if (reduce) {
      // freeze on the goal: run the story to just past the strike, render once, never loop
      for (let t = 0; t < 5.9; t += 1 / 60) step(1 / 60);
      renderer.render(scene, camera);
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting) && !reduce;
      if (visible) kick();
    }, { threshold: 0.15 });
    io.observe(container);

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth, nh = container.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      if (reduce) renderer.render(scene, camera);
    });
    ro.observe(container);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as unknown as { material?: { dispose?: () => void } }).material;
        if (mat?.dispose) mat.dispose();
      });
      glowTex.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} aria-hidden className="absolute inset-0" data-dribble-scene />
      {/* the market reads the run — ticks up on the goal, resets with the loop */}
      <div aria-hidden className="absolute right-4 top-4 flex items-baseline gap-2 rounded-chip border border-hairline/70 bg-bg/70 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-label font-semibold uppercase tracking-caps text-lo">To win</span>
        <span key={flashKey} className={`num text-strong font-bold text-hi ${flashKey > 0 ? "flash-up" : ""}`}>{price}</span>
      </div>
      <p className="sr-only">
        A stylized animation: a player dribbles past four defenders, shoots, and scores — the market
        price ticks up from 41.0 to 61.4 the moment the goal lands.
      </p>
    </div>
  );
}
