import Matter from "matter-js";

export const LETTER_FONT_SIZE = 36;
export const LETTER_FONT = `${LETTER_FONT_SIZE}px "Cormorant Garamond", Georgia, serif`;

// The pile is decorative only — nothing is lost by trimming it, so once it
// gets this large the oldest letters (the ones buried at the bottom) are
// just dropped to keep the physics sim light.
const MAX_LETTER_BODIES = 300;

export interface LetterLayoutEntry {
  char: string;
  x: number;
  width: number;
}

export interface LetterLayout {
  entries: LetterLayoutEntry[];
  totalWidth: number;
}

export function layoutText(ctx: CanvasRenderingContext2D, text: string): LetterLayout {
  ctx.font = LETTER_FONT;

  let cursorX = 0;
  const entries: LetterLayoutEntry[] = [];

  for (const char of text) {
    const metrics = ctx.measureText(char);
    if (/\s/.test(char)) {
      cursorX += metrics.width;
      continue;
    }
    entries.push({ char, x: cursorX + metrics.width / 2, width: metrics.width });
    cursorX += metrics.width;
  }

  return { entries, totalWidth: cursorX };
}

export function spawnText(
  engine: Matter.Engine,
  ctx: CanvasRenderingContext2D,
  text: string,
  dropOrigin: { x: number; y: number },
): Matter.Body[] {
  const { entries, totalWidth } = layoutText(ctx, text);
  const startX = dropOrigin.x - totalWidth / 2;

  const bodies = entries.map((entry) => {
    const body = Matter.Bodies.rectangle(
      startX + entry.x + (Math.random() - 0.5) * 4,
      dropOrigin.y,
      Math.max(entry.width, 4),
      LETTER_FONT_SIZE,
      {
        restitution: 0.4,
        friction: 0.3,
        angle: (Math.random() - 0.5) * 0.3,
      },
    );
    body.plugin = { char: entry.char };
    return body;
  });

  Matter.World.add(engine.world, bodies);

  const letterBodies = Matter.Composite.allBodies(engine.world).filter(
    (body) => typeof body.plugin?.char === "string",
  );
  const overflow = letterBodies.length - MAX_LETTER_BODIES;
  if (overflow > 0) {
    Matter.World.remove(engine.world, letterBodies.slice(0, overflow));
  }

  return bodies;
}
