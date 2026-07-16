import Matter from "matter-js";
import { LETTER_FONT } from "./letters";

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.font = LETTER_FONT;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const bodies = Matter.Composite.allBodies(engine.world);
  for (const body of bodies) {
    const char: unknown = body.plugin?.char;
    if (typeof char !== "string") continue;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}
