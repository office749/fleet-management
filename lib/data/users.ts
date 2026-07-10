import "server-only";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const INVITE_TTL_DAYS = 14;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** All team members with their active vehicle assignment (if any). */
export async function listTeam() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    include: {
      assignments: {
        where: { unassignedAt: null },
        include: { vehicle: { select: { id: true, label: true } } },
      },
    },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    hasPassword: !!u.passwordHash,
    pendingInvite: !u.passwordHash && !!u.inviteToken,
    inviteToken: !u.passwordHash ? u.inviteToken : null,
    vehicle: u.assignments[0]?.vehicle ?? null,
  }));
}

export async function listActiveDrivers() {
  return prisma.user.findMany({
    where: { role: "driver", isActive: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });
}

export async function emailExists(email: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  });
  return !!u;
}

/** Create a user with a password the admin will hand to them directly. */
export async function createUserWithPassword(params: {
  email: string;
  fullName: string;
  phone?: string | null;
  role: "admin" | "driver";
  password: string;
}) {
  return prisma.user.create({
    data: {
      email: params.email.toLowerCase().trim(),
      fullName: params.fullName,
      phone: params.phone ?? null,
      role: params.role,
      passwordHash: await hashPassword(params.password),
    },
  });
}

/** Create a user with an invite link (they set their own password). */
export async function createUserWithInvite(params: {
  email: string;
  fullName: string;
  phone?: string | null;
  role: "admin" | "driver";
}) {
  const token = randomBytes(24).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + INVITE_TTL_DAYS);
  const user = await prisma.user.create({
    data: {
      email: params.email.toLowerCase().trim(),
      fullName: params.fullName,
      phone: params.phone ?? null,
      role: params.role,
      inviteToken: token,
      inviteExpiresAt: expires,
    },
  });
  return { user, token };
}

export async function getUserByInviteToken(token: string) {
  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user) return null;
  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) return null;
  return user;
}

/** Accept an invite: set password, clear the token. */
export async function acceptInvite(token: string, password: string) {
  const user = await getUserByInviteToken(token);
  if (!user) throw new Error("This invite link is invalid or has expired.");
  return prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      inviteToken: null,
      inviteExpiresAt: null,
      isActive: true,
    },
  });
}

/** Admin resets/sets a user's password directly. */
export async function adminSetPassword(userId: string, password: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      inviteToken: null,
      inviteExpiresAt: null,
    },
  });
}

export async function setUserActive(userId: string, isActive: boolean) {
  // Deactivating unassigns them from vehicles but keeps all historical records.
  if (!isActive) {
    await prisma.vehicleAssignment.updateMany({
      where: { driverId: userId, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });
  }
  return prisma.user.update({ where: { id: userId }, data: { isActive } });
}

/** Regenerate an invite link for a pending user. */
export async function regenerateInvite(userId: string) {
  const token = randomBytes(24).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + INVITE_TTL_DAYS);
  await prisma.user.update({
    where: { id: userId },
    data: { inviteToken: token, inviteExpiresAt: expires },
  });
  return token;
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "admin", isActive: true } });
}
