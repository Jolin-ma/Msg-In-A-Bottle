import { NextResponse, after } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma/client";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { sendWelcomeEmail } from "@/lib/email";

const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const name: unknown = body?.name;
  const email: unknown = body?.email;
  const password: unknown = body?.password;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !EMAIL_PATTERN.test(email) ||
    password.length < MIN_PASSWORD_LENGTH ||
    (name !== undefined && typeof name !== "string")
  ) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }

  // The admin gate (lib/admin.ts) is an email match, and emails here are
  // unverified — never let anyone claim the admin address with a password.
  // The admin signs in with Google only. Answer exactly like the row
  // already existing so this reveals nothing.
  if (isAdminEmail(email)) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: trimmedName || null,
        passwordHash,
      },
    });
    after(() => sendWelcomeEmail(user.email, user.name));
    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    throw error;
  }
}
