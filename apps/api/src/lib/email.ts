import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'SnipQ - Your Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">SnipQ Verification</h2>
          <p>Your OTP code is:</p>
          <div style="background: #f4f4f5; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${otp}</span>
          </div>
          <p style="color: #71717a; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
    logger.info({ to }, 'OTP email sent');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send OTP email');
    throw error;
  }
}

export async function sendBookingConfirmation(
  to: string,
  data: {
    customerName: string;
    salonName: string;
    barberName: string;
    serviceName: string;
    date: string;
    time: string;
    checkinOtp: string;
  }
): Promise<void> {
  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'SnipQ - Booking Confirmed! 🎉',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Booking Confirmed!</h2>
          <p>Hi ${data.customerName},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #71717a;">Salon</td><td style="padding: 8px 0; font-weight: 600;">${data.salonName}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a;">Barber</td><td style="padding: 8px 0; font-weight: 600;">${data.barberName}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a;">Service</td><td style="padding: 8px 0; font-weight: 600;">${data.serviceName}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a;">Date</td><td style="padding: 8px 0; font-weight: 600;">${data.date}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a;">Time</td><td style="padding: 8px 0; font-weight: 600;">${data.time}</td></tr>
          </table>
          <div style="background: #f4f4f5; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px;">Check-in OTP</p>
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #18181b;">${data.checkinOtp}</span>
          </div>
          <p style="color: #71717a; font-size: 14px;">Show this OTP to the barber when you arrive.</p>
        </div>
      `,
    });
    logger.info({ to }, 'Booking confirmation email sent');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send booking confirmation email');
    throw error;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  otp: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: 'SnipQ - Password Reset',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Password Reset</h2>
          <p>You requested a password reset. Use this code:</p>
          <div style="background: #f4f4f5; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${otp}</span>
          </div>
          <p style="color: #71717a; font-size: 14px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    logger.info({ to }, 'Password reset email sent');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send password reset email');
    throw error;
  }
}
