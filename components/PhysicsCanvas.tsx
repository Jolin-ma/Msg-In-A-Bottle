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

const MAX_DELTA_MS = 33;

const PhysicsCanvas = forwardRef<PhysicsCanvasHandle>(function PhysicsCanvas(
  _props,
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

    const handleResize = () => {
      const rect = applyCanvasSize();
      resizePhysicsWorld(world, rect.width, rect.height);
    };
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(time - lastTime, MAX_DELTA_MS);
      lastTime = time;

      Matter.Engine.update(world.engine, delta);

      const rect = canvas.getBoundingClientRect();
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
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

export default PhysicsCanvas;
