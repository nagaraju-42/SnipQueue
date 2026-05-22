import { Request, Response } from 'express';
import { verifyWebhookSignature } from '../../lib/razorpay.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../config/logger.js';
import { sendBookingConfirmation } from '../../lib/email.js';
import { broadcastQueueUpdate } from '../../socket/queueHandler.js';
import { format } from 'date-fns';
import { io } from '../../socket/socketServer.js';
import { getBarberQueue } from '../queue/queueService.js';

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  notes?: Record<string, string>;
}

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
  };
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      res.status(400).json({ success: false, error: 'Missing signature' });
      return;
    }

    const body = req.body as Buffer;
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature');
      res.status(400).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body.toString());

    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const { id: razorpayPaymentId, order_id: razorpayOrderId } = payment;

      // Idempotency check — skip if payment already processed
      const existingBooking = await prisma.booking.findFirst({
        where: { razorpayPaymentId },
      });

      if (existingBooking) {
        logger.info({ razorpayPaymentId }, 'Payment already processed (idempotent)');
        res.json({ success: true, data: { message: 'Already processed' } });
        return;
      }

      // Find booking by Razorpay order ID
      const booking = await prisma.booking.findFirst({
        where: { razorpayOrderId },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          barber: {
            include: {
              user: { select: { name: true } },
              salon: { select: { name: true } },
            },
          },
          service: true,
          slot: true,
        },
      });

      if (!booking) {
        logger.warn({ razorpayOrderId }, 'Booking not found for payment');
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      // Confirm the booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          commitmentFeePaid: true,
          razorpayPaymentId,
        },
      });

      // Send confirmation email
      try {
        await sendBookingConfirmation(booking.customer.email, {
          customerName: booking.customer.name,
          salonName: booking.barber.salon.name,
          barberName: booking.barber.user.name,
          serviceName: booking.service.name,
          date: format(booking.slot.date, 'dd MMM yyyy'),
          time: format(booking.slot.startTime, 'hh:mm a'),
          checkinOtp: booking.checkinOtp,
        });
      } catch (emailError) {
        logger.error({ emailError, bookingId: booking.id }, 'Failed to send confirmation email');
        // Don't fail the webhook for email errors
      }

      // Broadcast queue update via Socket.io
      try {
        const queueData = await getBarberQueue(booking.barberId);
        broadcastQueueUpdate(io, booking.barberId, queueData);
      } catch (socketError) {
        logger.error({ socketError }, 'Failed to broadcast queue update');
      }

      logger.info(
        { bookingId: booking.id, razorpayPaymentId, razorpayOrderId },
        'Payment captured and booking confirmed'
      );
    }

    res.json({ success: true, data: { message: 'Webhook processed' } });
  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
}
