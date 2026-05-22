import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { createOtp, verifyOtp } from './otpService.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../../lib/email.js';
import type {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './authValidation.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function generateAccessToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES as any });
}

function generateRefreshToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES as any });
}

// ── Register ────────────────────────────────────────

export async function register(input: RegisterInput) {
  const { name, email, phone, password, role } = input;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: role as 'CUSTOMER' | 'OWNER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // Generate and send OTP
  const otp = await createOtp(email, 'verify');
  await sendOtpEmail(email, otp);

  logger.info({ userId: user.id, email }, 'User registered');

  return {
    user,
    message: 'Registration successful. Please verify your email with the OTP sent.',
  };
}

// ── Verify OTP ──────────────────────────────────────

export async function verifyEmailOtp(input: VerifyOtpInput) {
  const { email, otp } = input;

  const isValid = await verifyOtp(email, otp, 'verify');
  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isVerified: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
    },
  });

  // Generate tokens
  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token in Redis
  await redis.setex(`refresh:${user.id}:${refreshToken}`, REFRESH_TOKEN_TTL, 'valid');

  logger.info({ userId: user.id }, 'Email verified');

  return {
    user,
    accessToken,
    refreshToken,
  };
}

// ── Login ───────────────────────────────────────────

export async function login(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      passwordHash: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isVerified) {
    // Re-send OTP
    const otp = await createOtp(email, 'verify');
    await sendOtpEmail(email, otp);
    throw new AppError('Email not verified. A new OTP has been sent.', 403, 'EMAIL_NOT_VERIFIED');
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await redis.setex(`refresh:${user.id}:${refreshToken}`, REFRESH_TOKEN_TTL, 'valid');

  logger.info({ userId: user.id }, 'User logged in');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

// ── Refresh Token ───────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  let decoded: { id: string; email: string; role: string };

  try {
    decoded = jwt.verify(refreshToken, env.JWT_SECRET) as typeof decoded;
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Check if refresh token exists in Redis
  const stored = await redis.get(`refresh:${decoded.id}:${refreshToken}`);
  if (!stored) {
    throw new AppError('Refresh token revoked or expired', 401, 'REFRESH_TOKEN_REVOKED');
  }

  // Delete old refresh token
  await redis.del(`refresh:${decoded.id}:${refreshToken}`);

  // Generate new tokens
  const tokenPayload = { id: decoded.id, email: decoded.email, role: decoded.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  await redis.setex(`refresh:${decoded.id}:${newRefreshToken}`, REFRESH_TOKEN_TTL, 'valid');

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

// ── Forgot Password ─────────────────────────────────

export async function forgotPassword(input: ForgotPasswordInput) {
  const { email } = input;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists
    return { message: 'If this email is registered, you will receive a reset code.' };
  }

  const otp = await createOtp(email, 'reset');
  await sendPasswordResetEmail(email, otp);

  logger.info({ email }, 'Password reset OTP sent');

  return { message: 'If this email is registered, you will receive a reset code.' };
}

// ── Reset Password ──────────────────────────────────

export async function resetPassword(input: ResetPasswordInput) {
  const { email, otp, newPassword } = input;

  const isValid = await verifyOtp(email, otp, 'reset');
  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  logger.info({ email }, 'Password reset successful');

  return { message: 'Password reset successful. Please login with your new password.' };
}
