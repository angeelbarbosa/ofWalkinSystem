"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = "BEKSIJuQidDwTEYEn8V8FTi6SBYq_aVMbmd58ZTp35FVPqtUlNAkxfOUrAz2QpE59Vf4uxCsLylD9-l79G76C40";
const VAPID_PRIVATE_KEY = "oc8po93tS7ZGhUKcHCyxF-G_dU_R1iYRln4Q15FSVaY";

// Set VAPID credentials for Web Push
webpush.setVapidDetails(
  "mailto:contact@ofbarberandsupply.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const sendPushNotification = action({
  args: {
    clientName: v.string(),
    barberName: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    barberId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.runQuery(internal.notifications.getSubscriptions, {});
    const targetBarber = (args.barberName || "").trim().toLowerCase();
    const targetId = (args.barberId || "").trim().toLowerCase();

    const title = `🔔 ${args.clientName} is here for ${args.barberName || 'you'}!`;
    const body = args.appointmentTime 
      ? `Appointment at ${args.appointmentTime} • Waiting in lobby.` 
      : `Arrival • Waiting in lobby.`;

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: '/?portal=barber' }
    });

    for (const sub of subscriptions) {
      const subBarberId = (sub.barberId || "").trim().toLowerCase();
      const subBarberName = (sub.barberName || "").trim().toLowerCase();

      const shouldAlert =
        subBarberId === "all" ||
        subBarberName === "all" ||
        subBarberName === targetBarber ||
        subBarberId === targetId ||
        (targetBarber && subBarberName.includes(targetBarber)) ||
        (subBarberName && targetBarber.includes(subBarberName));

      if (shouldAlert) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                auth: sub.auth,
                p256dh: sub.p256dh
              }
            },
            payload
          );
        } catch (err: any) {
          console.warn("Failed to deliver Web Push notification:", err?.statusCode || err);
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            // Subscription has expired or user revoked it; clean up
            await ctx.runMutation(internal.notifications.removeSubscription, { endpoint: sub.endpoint });
          }
        }
      }
    }
  }
});
