import Matter from "matter-js";

interface BottlePluginData {
  image: HTMLImageElement;
  width: number;
  height: number;
  slug: string | null;
}

export function loadBottleImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function loadBottleImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map(loadBottleImage));
}

export function spawnBottle(
  engine: Matter.Engine,
  image: HTMLImageElement,
  x: number,
  y: number,
  targetWidth: number,
  slug: string | null = null,
): Matter.Body {
  const scale = targetWidth / image.naturalWidth;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  const body = Matter.Bodies.rectangle(x, y, width, height, {
    restitution: 0.3,
    friction: 0.5,
    frictionAir: 0.01,
    angle: (Math.random() - 0.5) * 1.4,
  });

  const plugin: BottlePluginData = { image, width, height, slug };
  body.plugin = plugin;

  Matter.World.add(engine.world, body);
  return body;
}

export function renderBottles(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);

  const bodies = Matter.Composite.allBodies(engine.world);
  for (const body of bodies) {
    const plugin = body.plugin as Partial<BottlePluginData> | undefined;
    if (!plugin?.image || !plugin.width || !plugin.height) continue;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.drawImage(
      plugin.image,
      -plugin.width / 2,
      -plugin.height / 2,
      plugin.width,
      plugin.height,
    );
    ctx.restore();
  }
}
