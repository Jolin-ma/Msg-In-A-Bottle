"use client";

import Matter from "matter-js";
import { useEffect, useRef } from "react";
import {
  createPhysicsWorld,
  destroyPhysicsWorld,
  resizePhysicsWorld,
} from "@/lib/physics/engine";
import {
  loadBottleImage,
  renderBottles,
  spawnBottle,
} from "@/lib/physics/bottleField";
import styles from "./BottlePhysics.module.css";

const BOTTLE_COUNT = 7;
const MIN_WIDTH = 80;
const MAX_WIDTH = 150;
const SPAWN_STAGGER_MS = 180;
const MAX_DELTA_MS = 33;
const HOVER_BOB_FORCE = 0.0009;
const HOVER_BOB_SPEED = 160;

export default function BottlePhysics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const bottleBodies: Matter.Body[] = [];

    const handleResize = () => {
      const rect = applyCanvasSize();
      resizePhysicsWorld(world, rect.width, rect.height);
    };
    window.addEventListener("resize", handleResize);

    let rafId: number | null = null;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(time - lastTime, MAX_DELTA_MS);
      lastTime = time;

      const hovered = Matter.Query.point(bottleBodies, mouse.position)[0];
      if (hovered && mouseConstraint.body !== hovered) {
        const wobble = Math.sin(time / HOVER_BOB_SPEED) * HOVER_BOB_FORCE;
        Matter.Body.applyForce(hovered, hovered.position, {
          x: wobble * 0.4,
          y: -Math.abs(wobble),
        });
      }

      Matter.Engine.update(world.engine, delta);

      const rect = canvas.getBoundingClientRect();
      renderBottles(ctx, world.engine, rect.width, rect.height);

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    loadBottleImage("/bottle.png")
      .then((image) => {
        if (cancelled) return;
        for (let i = 0; i < BOTTLE_COUNT; i++) {
          const timeout = setTimeout(() => {
            const rect = canvas.getBoundingClientRect();
            const width = MIN_WIDTH + Math.random() * (MAX_WIDTH - MIN_WIDTH);
            const x = rect.width * (0.1 + Math.random() * 0.8);
            bottleBodies.push(spawnBottle(world.engine, image, x, -100, width));
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
      Matter.World.remove(world.engine.world, mouseConstraint);
      Matter.Mouse.clearSourceEvents(mouse);
      destroyPhysicsWorld(world);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
