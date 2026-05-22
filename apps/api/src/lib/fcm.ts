import admin from 'firebase-admin';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'snipq_notifications',
        },
      },
    });
    logger.info({ title }, 'Push notification sent');
  } catch (error) {
    // If token is invalid, just log and don't throw
    logger.warn({ error, fcmToken: fcmToken.substring(0, 10) + '...' }, 'Failed to send push notification');
  }
}
