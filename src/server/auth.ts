import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "seedha-properties-secure-jwt-secret-key-2026-production",
);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: AuthUser, expiresIn: string = "30d"): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as string) || "customer",
      fullName: (payload.name as string) || "",
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim();
}
