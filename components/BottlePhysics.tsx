"use client";

import Matter from "matter-js";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createPhysicsWorld,
  destroyPhysicsWorld,
  resizePhysicsWorld,
} from "@/lib/physics/engine";
import {
  loadBottleImages,
  renderBottles,
  spawnBottle,
} from "@/lib/physics/bottleField";
import styles from "./BottlePhysics.module.css";

const BOTTLE_IMAGE_SRCS = ["/bottle1.png", "/bottle2.png", "/bottle3.png"];
const BOTTLE_COUNT = 7;
const MIN_WIDTH = 80;
const MAX_WIDTH = 150;
const SPAWN_STAGGER_MS = 180;
const MAX_DELTA_MS = 33;
const CLICK_MOVE_THRESHOLD = 6;

interface BottlePhysicsProps {
  bottleSlugs?: string[];
}

export default function BottlePhysics({ bottleSlugs = [] }: BottlePhysicsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const applyCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    };

    const initialRect = applyCanvasSize();
    const world = createPhysicsWorld(initialRect.width, initialRect.height);

    const mouse = Matter.Mouse.create(canvas);
    const mouseConstraint = Matter.MouseConstraint.create(world.engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    Matter.World.add(world.engine.world, mouseConstraint);

    // The canvas backing store is scaled by devicePixelRatio, but the physics
    // world uses CSS pixels — rescale Matter's mouse to match or the grab
    // hit-test lands in the wrong place on HiDPI/scaled displays.
    const applyMouseScale = () => {
      const dpr = window.devicePixelRatio || 1;
      Matter.Mouse.setScale(mouse, { x: 1 / dpr, y: 1 / dpr });
    };
    applyMouseScale();

    const handleResize = () => {
      const rect = applyCanvasSize();
      resizePhysicsWorld(world, rect.width, rect.height);
      applyMouseScale();
    };
    window.addEventListener("resize", handleResize);

    // A bottle is a message that's already out there — clicking one (as
    // opposed to dragging it) takes you to where you can read/reply to it.
    // Pointer events (not mousedown/mouseup) — Matter's own Mouse instance
    // above calls preventDefault() on touchstart/touchend for this same
    // canvas, which suppresses the browser's synthetic mousedown/mouseup on
    // real touchscreens. Pointer events aren't part of that suppression, so
    // this is what makes tapping a bottle actually work on mobile.
    let downPos: { x: number; y: number } | null = null;
    const handlePointerDown = (event: PointerEvent) => {
      downPos = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (!downPos) return;
      const dx = event.clientX - downPos.x;
      const dy = event.clientY - downPos.y;
      downPos = null;
      if (Math.hypot(dx, dy) > CLICK_MOVE_THRESHOLD) return;

      const rect = canvas.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const bodies = Matter.Composite.allBodies(world.engine.world);
      const [hit] = Matter.Query.point(bodies, point).filter((body) => body.plugin?.image);
      if (hit) {
        const slug = hit.plugin?.slug as string | null | undefined;
        router.push(slug ? `/${slug}` : "/preview");
      }
    };
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    let rafId: number | null = null;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(time - lastTime, MAX_DELTA_MS);
      lastTime = time;

      Matter.Engine.update(world.engine, delta);

      const rect = canvas.getBoundingClientRect();
      renderBottles(ctx, world.engine, rect.width, rect.height);

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    loadBottleImages(BOTTLE_IMAGE_SRCS)
      .then((images) => {
        if (cancelled) return;
        for (let i = 0; i < BOTTLE_COUNT; i++) {
          const timeout = setTimeout(() => {
            const rect = canvas.getBoundingClientRect();
            const image = images[Math.floor(Math.random() * images.length)];
            const width = MIN_WIDTH + Math.random() * (MAX_WIDTH - MIN_WIDTH);
            const x = rect.width * (0.1 + Math.random() * 0.8);
            const slug = bottleSlugs.length
              ? bottleSlugs[i % bottleSlugs.length]
              : null;
            spawnBottle(world.engine, image, x, -100, width, slug);
          }, i * SPAWN_STAGGER_MS);
          timeouts.push(timeout);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      Matter.World.remove(world.engine.world, mouseConstraint);
      Matter.Mouse.clearSourceEvents(mouse);
      destroyPhysicsWorld(world);
    };
  }, [router, bottleSlugs]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
