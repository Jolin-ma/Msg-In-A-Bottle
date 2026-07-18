"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LiveFeedbackStream.module.css";

const BOTTLE_IMAGE_SRCS = ["/bottle1.png", "/bottle2.png", "/bottle3.png"];
const SPAWN_INTERVAL_MS = 2600;
const MAX_ON_SCREEN = 6;
const BOTTLE_WIDTH = 30;
const WAKE_COPIES = 3;

interface Drifter {
  id: string;
  x: number;
  baseY: number;
  speed: number;
  bobAmplitude: number;
  bobFreq: number;
  bobPhase: number;
  rotAmplitude: number;
  image: HTMLImageElement;
}

function loadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(
    srcs.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        }),
    ),
  );
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function LiveFeedbackStream({ items }: { items: { id: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  const itemsRef = useRef(items);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    let cancelled = false;
    const drifters: Drifter[] = [];
    let cursor = 0;
    let lastSpawn = -SPAWN_INTERVAL_MS;
    let rafId: number | null = null;
    let images: HTMLImageElement[] = [];

    const applyCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    };

    let rect = applyCanvasSize();
    const handleResize = () => {
      rect = applyCanvasSize();
    };
    window.addEventListener("resize", handleResize);

    function spawnDrifter(time: number) {
      const source = itemsRef.current;
      if (source.length === 0 || images.length === 0) return;
      if (drifters.length >= MAX_ON_SCREEN) return;

      const item = source[cursor % source.length];
      cursor += 1;

      drifters.push({
        id: `${item.id}-${time}`,
        x: -BOTTLE_WIDTH,
        baseY: randomBetween(rect.height * 0.25, rect.height * 0.75),
        speed: randomBetween(14, 26),
        bobAmplitude: randomBetween(6, 14),
        bobFreq: randomBetween(0.5, 1.1),
        bobPhase: Math.random() * Math.PI * 2,
        rotAmplitude: randomBetween(0.15, 0.35),
        image: images[Math.floor(Math.random() * images.length)],
      });
    }

    let lastTime = performance.now();
    function loop(time: number) {
      if (cancelled) return;
      const deltaSec = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (!pausedRef.current) {
        if (time - lastSpawn > SPAWN_INTERVAL_MS) {
          lastSpawn = time;
          spawnDrifter(time);
        }
        for (const drifter of drifters) {
          drifter.x += drifter.speed * deltaSec;
        }
        for (let i = drifters.length - 1; i >= 0; i--) {
          if (drifters[i].x > rect.width + BOTTLE_WIDTH) drifters.splice(i, 1);
        }
      }

      ctx.clearRect(0, 0, rect.width, rect.height);
      const t = time / 1000;
      for (const drifter of drifters) {
        const y =
          drifter.baseY + Math.sin(t * drifter.bobFreq + drifter.bobPhase) * drifter.bobAmplitude;
        const rotation = Math.sin(t * drifter.bobFreq * 0.6 + drifter.bobPhase) * drifter.rotAmplitude;
        const scale = BOTTLE_WIDTH / drifter.image.naturalWidth;
        const w = drifter.image.naturalWidth * scale;
        const h = drifter.image.naturalHeight * scale;

        for (let wake = WAKE_COPIES; wake >= 1; wake--) {
          ctx.save();
          ctx.globalAlpha = 0.14 * (WAKE_COPIES - wake + 1);
          ctx.translate(drifter.x - wake * 10, y);
          ctx.rotate(rotation);
          ctx.drawImage(drifter.image, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.translate(drifter.x, y);
        ctx.rotate(rotation);
        ctx.drawImage(drifter.image, -w / 2, -h / 2, w, h);
        ctx.restore();
      }

      rafId = requestAnimationFrame(loop);
    }

    loadImages(BOTTLE_IMAGE_SRCS)
      .then((loaded) => {
        if (cancelled) return;
        images = loaded;
        rafId = requestAnimationFrame(loop);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <button
          type="button"
          className={styles.pauseButton}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? "resume" : "pause"}
        </button>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
      {items.length === 0 && <p className={styles.idle}>Nothing incoming right now.</p>}
    </div>
  );
}
