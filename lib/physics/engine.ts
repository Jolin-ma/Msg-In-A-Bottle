import Matter from "matter-js";

const BOUNDARY_THICKNESS = 200;

export interface PhysicsWorld {
  engine: Matter.Engine;
  floor: Matter.Body;
  leftWall: Matter.Body;
  rightWall: Matter.Body;
}

function createBoundaries(width: number, height: number) {
  const floor = Matter.Bodies.rectangle(
    width / 2,
    height + BOUNDARY_THICKNESS / 2,
    width * 4,
    BOUNDARY_THICKNESS,
    { isStatic: true, friction: 0.6 },
  );
  const leftWall = Matter.Bodies.rectangle(
    -BOUNDARY_THICKNESS / 2,
    height / 2,
    BOUNDARY_THICKNESS,
    height * 4,
    { isStatic: true },
  );
  const rightWall = Matter.Bodies.rectangle(
    width + BOUNDARY_THICKNESS / 2,
    height / 2,
    BOUNDARY_THICKNESS,
    height * 4,
    { isStatic: true },
  );
  return { floor, leftWall, rightWall };
}

export function createPhysicsWorld(width: number, height: number): PhysicsWorld {
  const engine = Matter.Engine.create();
  const { floor, leftWall, rightWall } = createBoundaries(width, height);
  Matter.World.add(engine.world, [floor, leftWall, rightWall]);
  return { engine, floor, leftWall, rightWall };
}

export function resizePhysicsWorld(world: PhysicsWorld, width: number, height: number) {
  Matter.Body.setPosition(world.floor, {
    x: width / 2,
    y: height + BOUNDARY_THICKNESS / 2,
  });
  Matter.Body.setPosition(world.leftWall, { x: -BOUNDARY_THICKNESS / 2, y: height / 2 });
  Matter.Body.setPosition(world.rightWall, {
    x: width + BOUNDARY_THICKNESS / 2,
    y: height / 2,
  });
}

export function destroyPhysicsWorld(world: PhysicsWorld) {
  Matter.World.clear(world.engine.world, false);
  Matter.Engine.clear(world.engine);
}
