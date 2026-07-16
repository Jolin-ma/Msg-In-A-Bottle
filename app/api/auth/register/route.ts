import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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
