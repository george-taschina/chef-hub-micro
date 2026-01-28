import jwt from "jsonwebtoken";

// JWT Payload structure
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name: string;
  surname: string;
  chefProfileId?: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Service context passed to handlers
export interface ServiceContext {
  userId: string;
  email: string;
  name: string;
  chefProfileId?: string;
  roles: string[];
  requestId: string;
}

// Token verification options
export interface VerifyOptions {
  secret: string;
  issuer?: string;
  audience?: string;
}

// Verify and decode JWT token
export function verifyToken(token: string, options: VerifyOptions): JwtPayload {
  return jwt.verify(token, options.secret, {
    issuer: options.issuer,
    audience: options.audience,
  }) as JwtPayload;
}

// Extract token from Authorization header
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

// Create service context from JWT payload
export function createServiceContext(
  payload: JwtPayload,
  requestId: string
): ServiceContext {
  return {
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    chefProfileId: payload.chefProfileId,
    roles: payload.roles,
    requestId,
  };
}

// Guard: Check if user has chef profile
export function requireChefProfile(ctx: ServiceContext): boolean {
  return ctx.chefProfileId !== undefined && ctx.chefProfileId !== null;
}

// Guard: Check if user owns the resource
export function requireOwnership(
  ctx: ServiceContext,
  resourceOwnerId: string
): boolean {
  return ctx.userId === resourceOwnerId;
}

// Guard: Check if user has specific role
export function requireRole(ctx: ServiceContext, role: string): boolean {
  return ctx.roles.includes(role);
}

// Guard: Check if user has any of the specified roles
export function requireAnyRole(ctx: ServiceContext, roles: string[]): boolean {
  return roles.some((role) => ctx.roles.includes(role));
}

// Generate JWT token (for identity service)
export interface GenerateTokenOptions {
  secret: string;
  expiresIn: string;
  issuer?: string;
  audience?: string;
}

export function generateToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  options: GenerateTokenOptions
): string {
  return jwt.sign(payload, options.secret, {
    expiresIn: options.expiresIn,
    issuer: options.issuer,
    audience: options.audience,
  });
}

// Roles
export const Roles = {
  USER: 'user',
  CHEF: 'chef',
  ADMIN: 'admin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
