import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const VAPID_PUBLIC_KEY = "BEKSIJuQidDwTEYEn8V8FTi6SBYq_aVMbmd58ZTp35FVPqtUlNAkxfOUrAz2QpE59Vf4uxCsLylD9-l79G76C40";

export const saveSubscription = mutation({
  args: {
    barberId: v.string(),
    barberName: v.string(),
    endpoint: v.string(),
    auth: v.string(),
    p256dh: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    const updatedAt = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        barberId: args.barberId,
        barberName: args.barberName,
        auth: args.auth,
        p256dh: args.p256dh,
        updatedAt
      });
    } else {
      await ctx.db.insert("pushSubscriptions", {
        barberId: args.barberId,
        barberName: args.barberName,
        endpoint: args.endpoint,
        auth: args.auth,
        p256dh: args.p256dh,
        updatedAt
      });
    }
  }
});

export const getSubscriptions = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("pushSubscriptions").collect();
  }
});

export const removeSubscription = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  }
});

export const getVapidPublicKey = query({
  handler: async () => {
    return VAPID_PUBLIC_KEY;
  }
});
