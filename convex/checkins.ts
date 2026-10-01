import { query, mutation } from "./_generated/server";
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
    return await ctx.db.insert("checkIns", {
      ...args,
      checkInTime,
      status: "waiting"
    });
  }
});

export const updateStatus = mutation({
  args: {
    id: v.id("checkIns"),
    status: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
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
