import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("checkIns").collect();
    // Return newest first
    return list.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }
});

export const add = mutation({
  args: {
    clientName: v.string(),
    clientPhone: v.optional(v.string()),
    type: v.string(),
    barberId: v.optional(v.string()),
    barberName: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const checkInTime = new Date().toISOString();
    const id = await ctx.db.insert("checkIns", {
      ...args,
      checkInTime,
      status: "waiting"
    });

    // Schedule real-time Web Push alert to target barber's mobile lockscreen
    try {
      await ctx.scheduler.runAfter(0, api.pushActions.sendPushNotification, {
        clientName: args.clientName,
        barberName: args.barberName,
        appointmentTime: args.appointmentTime,
        barberId: args.barberId
      });
    } catch (e) {
      console.warn("Could not schedule push notification:", e);
    }

    return id;
  }
});

export const updateStatus = mutation({
  args: {
    id: v.id("checkIns"),
    status: v.string(),
    barberId: v.optional(v.string()),
    barberName: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const patch: any = { status: args.status };
    if (args.barberId !== undefined) patch.barberId = args.barberId;
    if (args.barberName !== undefined) patch.barberName = args.barberName;
    if (args.notes !== undefined) patch.notes = args.notes;
    await ctx.db.patch(args.id, patch);
  }
});

export const clearCompleted = mutation({
  handler: async (ctx) => {
    const completed = await ctx.db
      .query("checkIns")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();
    for (const record of completed) {
      await ctx.db.delete(record._id);
    }
  }
});
