"use client";

import Matter from "matter-js";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  createPhysicsWorld,
  destroyPhysicsWorld,
  resizePhysicsWorld,
  type PhysicsWorld,
} from "@/lib/physics/engine";
import { LETTER_FONT, spawnText as spawnLetterBodies } from "@/lib/physics/letters";
import { renderFrame } from "@/lib/physics/render";
import styles from "./PhysicsCanvas.module.css";

export interface PhysicsCanvasHandle {
  spawnText: (text: string) => void;
}

interface PhysicsCanvasProps {
  // Returns the current viewport-relative Y (px) above which settled
  // letters get pruned — measured live off a real DOM element (e.g. a
  // diary's compose box) rather than a guessed fraction, so the cutoff
  // tracks its actual on-screen position exactly. Not a physical wall
  // (that would block the fall path entirely) — just periodic cleanup of
  // already-resting letters that ended up at or above the line. Omit for
  // no cap (the default, unbounded pile).
  getCeilingY?: () => number | null | undefined;
}

const MAX_DELTA_MS = 33;
const CEILING_BUFFER_PX = 100;

const PhysicsCanvas = forwardRef<PhysicsCanvasHandle, PhysicsCanvasProps>(function PhysicsCanvas(
  { getCeilingY },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const worldRef = useRef<PhysicsWorld | null>(null);
  const rafRef = useRef<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      spawnText(text: string) {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const world = worldRef.current;
        if (!canvas || !ctx || !world) return;

        const rect = canvas.getBoundingClientRect();
        spawnLetterBodies(world.engine, ctx, text, {
          x: rect.width / 2,
          y: -80,
        });
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    document.fonts.load(LETTER_FONT).catch(() => {});

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
    worldRef.current = world;

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

    const CEILING_CHECK_INTERVAL_MS = 250;
    const SETTLED_SPEED_THRESHOLD = 0.8;
    let lastCeilingCheck = 0;

    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(time - lastTime, MAX_DELTA_MS);
      lastTime = time;

      Matter.Engine.update(world.engine, delta);

      const rect = canvas.getBoundingClientRect();

      // Periodically prune letters that have already come to rest at or
      // above the ceiling line — never touches bodies still actively
      // falling through that height, so it can't interrupt anything
      // mid-drop.
      if (time - lastCeilingCheck > CEILING_CHECK_INTERVAL_MS) {
        lastCeilingCheck = time;
        const ceilingY = getCeilingY?.();
        if (typeof ceilingY === "number") {
          const threshold = ceilingY - CEILING_BUFFER_PX;
          const settledAboveCeiling = Matter.Composite.allBodies(world.engine.world).filter(
            (body) =>
              typeof body.plugin?.char === "string" &&
              body.position.y < threshold &&
              body.speed < SETTLED_SPEED_THRESHOLD,
          );
          if (settledAboveCeiling.length > 0) {
            Matter.World.remove(world.engine.world, settledAboveCeiling);
          }
        }
      }

      renderFrame(ctx, world.engine, rect.width, rect.height);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      Matter.World.remove(world.engine.world, mouseConstraint);
      Matter.Mouse.clearSourceEvents(mouse);
      destroyPhysicsWorld(world);
      worldRef.current = null;
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

export default PhysicsCanvas;
