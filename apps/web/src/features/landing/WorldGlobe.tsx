"use client";
import { useEffect, useRef } from "react";
import {
  Scene, PerspectiveCamera, WebGLRenderer, SphereGeometry, MeshBasicMaterial,
  Color, Mesh, Group, InstancedMesh, Matrix4,
} from "three";
import { resolveColor } from "../../design/tokens";

// Originkit "globe", ported to Ninety law: npm `three` (the CDN URL-imports are a Framer-only
// mechanism), d3-geo DROPPED (its equirectangular mapping is three lines below), and the runtime
// Natural-Earth fetch replaced by the BAKED land mask at /world-land.png (ADR-055: zero runtime
// network — re-bake via apps/web/scripts/bake-land.mjs). Dots-only look (no tube outlines/graticule),
// token colors, one marker on MetLife Stadium (the final). rAF runs ONLY while visible AND moving;
// reduced motion → static globe, drag still works (user-driven frames only).

const DOT_STEP = 1.7; // degrees between dot rows — ~7k land dots
const MARKER = { lat: 40.813, lng: -74.074 }; // MetLife Stadium — the Jul 19 final

function latLngToXYZ(lat: number, lng: number): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
}

export function WorldGlobe({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new Scene();
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 360;
    const camera = new PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(0, 0, 2.4);
    camera.lookAt(0, 0, 0);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const globe = new Group();
    scene.add(globe);

    // ocean sphere in the surface token — solid, so far-side dots occlude
    const ocean = new Mesh(
      new SphereGeometry(1, 48, 48),
      new MeshBasicMaterial({ color: new Color(resolveColor("surface") || undefined) }),
    );
    globe.add(ocean);

    // rotation state (ported): lerped target + drag with momentum
    const rotation = { x: -0.4, y: 0.4 };
    const target = { x: rotation.x, y: rotation.y };
    const velocity = { x: 0, y: 0 };
    let dragging = false;
    let hovering = false;
    let visible = false;
    let raf = 0;
    const AUTO = reduce ? 0 : 0.0022; // slow drift; 0 under reduced motion
    const LERP = 0.08;
    const DECAY = 0.92;

    const render = () => renderer.render(scene, camera);

    const loop = () => {
      raf = 0;
      if (disposed) return;
      if (!dragging && AUTO !== 0 && !hovering) target.x += AUTO;
      if (!dragging && (Math.abs(velocity.x) > 0.0004 || Math.abs(velocity.y) > 0.0004)) {
        target.x += velocity.x;
        target.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, target.y + velocity.y));
        velocity.x *= DECAY;
        velocity.y *= DECAY;
      }
      const dx = target.x - rotation.x;
      const dy = target.y - rotation.y;
      rotation.x += dx * LERP;
      rotation.y += dy * LERP;
      globe.rotation.y = rotation.x;
      globe.rotation.x = rotation.y;
      render();
      const moving = dragging || (AUTO !== 0 && !hovering) || Math.abs(dx) > 0.0005 || Math.abs(velocity.x) > 0.0004;
      if (visible && moving) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(loop);
    };

    // dots from the baked land mask
    const img = new Image();
    img.src = "/world-land.png";
    img.onload = () => {
      if (disposed) return;
      const mc = document.createElement("canvas");
      mc.width = img.width;
      mc.height = img.height;
      const mctx = mc.getContext("2d", { willReadFrequently: true });
      if (!mctx) return;
      mctx.drawImage(img, 0, 0);
      const pixels = mctx.getImageData(0, 0, mc.width, mc.height).data;
      const isLand = (lng: number, lat: number): boolean => {
        const x = Math.round(((lng + 180) / 360) * mc.width) % mc.width;
        const y = Math.max(0, Math.min(mc.height - 1, Math.round(((90 - lat) / 180) * mc.height)));
        return pixels[(y * mc.width + x) * 4] > 128;
      };
      const coords: Array<[number, number]> = [];
      for (let lat = -90; lat <= 90; lat += DOT_STEP) {
        const cosLat = Math.cos((Math.abs(lat) * Math.PI) / 180);
        const lngStep = cosLat > 0.01 ? DOT_STEP / Math.max(0.3, cosLat) : 360;
        for (let lng = -180; lng < 180; lng += lngStep) if (isLand(lng, lat)) coords.push([lng, lat]);
      }
      const dots = new InstancedMesh(
        new SphereGeometry(0.0045, 4, 4),
        new MeshBasicMaterial({ color: new Color(resolveColor("textLo") || undefined) }),
        coords.length,
      );
      const mat = new Matrix4();
      coords.forEach(([lng, lat], i) => {
        const [x, y, z] = latLngToXYZ(lat, lng);
        mat.setPosition(x * 1.002, y * 1.002, z * 1.002);
        dots.setMatrixAt(i, mat);
      });
      dots.instanceMatrix.needsUpdate = true;
      globe.add(dots);

      // the final — MetLife Stadium, in the up token
      const marker = new Mesh(
        new SphereGeometry(0.018, 16, 16),
        new MeshBasicMaterial({ color: new Color(resolveColor("up") || undefined) }),
      );
      const [mx, my, mz] = latLngToXYZ(MARKER.lat, MARKER.lng);
      marker.position.set(mx * 1.005, my * 1.005, mz * 1.005);
      globe.add(marker);
      render();
      kick();
    };

    // drag (pointer events; velocity carries momentum)
    let lastX = 0, lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      velocity.x = 0;
      velocity.y = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const s = 0.006;
      target.x += (e.clientX - lastX) * s;
      target.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, target.y + (e.clientY - lastY) * s));
      velocity.x = (e.clientX - lastX) * s * 0.3;
      velocity.y = (e.clientY - lastY) * s * 0.3;
      lastX = e.clientX;
      lastY = e.clientY;
      kick();
    };
    const onUp = () => { dragging = false; };
    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; kick(); };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);

    // the loop exists only while on screen
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(container);

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || 360;
      const nh = container.clientHeight || 360;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      render();
    });
    ro.observe(container);
    render();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as MeshBasicMaterial | undefined;
        if (m?.dispose) m.dispose();
      });
      renderer.dispose();
      container.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} aria-hidden className={`relative cursor-grab active:cursor-grabbing ${className}`} />;
}
