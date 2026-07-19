import type { CSSProperties } from "react";
import { DRIFT_DURATION_MS } from "@/lib/driftTiming";

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomSigned(magnitude: number) {
  return (Math.random() < 0.5 ? -1 : 1) * magnitude;
}

export function randomDriftStyle(): CSSProperties {
  return {
    "--drift-duration": `${DRIFT_DURATION_MS / 1000}s`,
    "--dx1": `${randomSigned(randomBetween(10, 25))}vw`,
    "--dy1": `${randomSigned(randomBetween(5, 15))}vh`,
    "--r1": `${randomSigned(randomBetween(8, 18))}deg`,
    "--dx2": `${randomSigned(randomBetween(15, 35))}vw`,
    "--dy2": `${-randomBetween(15, 30)}vh`,
    "--r2": `${randomSigned(randomBetween(6, 16))}deg`,
    "--dx3": `${randomSigned(randomBetween(10, 30))}vw`,
    "--dy3": `${-randomBetween(25, 45)}vh`,
    "--r3": `${randomSigned(randomBetween(8, 18))}deg`,
    "--dx4": `${randomSigned(randomBetween(15, 35))}vw`,
    "--dy4": `${-randomBetween(40, 60)}vh`,
    "--r4": `${randomSigned(randomBetween(6, 16))}deg`,
    "--dx5": `${randomSigned(randomBetween(10, 30))}vw`,
    "--dy5": `${-randomBetween(55, 75)}vh`,
    "--r5": `${randomSigned(randomBetween(8, 18))}deg`,
    "--dx6": `${randomSigned(randomBetween(15, 35))}vw`,
    "--dy6": `${-randomBetween(70, 90)}vh`,
  } as CSSProperties;
}
