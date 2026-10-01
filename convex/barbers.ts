import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_TEAM = [
  { name: "Brandon", specialty: "Master Cuts & Grooming", phone: "(555) 234-5678", stationNumber: 1, isWorking: true },
  { name: "Micah", specialty: "Master Cuts & Grooming", phone: "(555) 345-6789", stationNumber: 2, isWorking: true },
  { name: "Ruben", specialty: "Master Cuts & Grooming", phone: "(555) 456-7890", stationNumber: 3, isWorking: true },
  { name: "Angel", specialty: "Master Cuts & Grooming", phone: "(555) 567-8901", stationNumber: 4, isWorking: true },
  { name: "Sosa", specialty: "Master Cuts & Grooming", phone: "(555) 678-9012", stationNumber: 5, isWorking: true },
  { name: "Barber 6", specialty: "Master Cuts & Grooming", phone: "(555) 789-0123", stationNumber: 6, isWorking: true },
  { name: "Barber 7", specialty: "Master Cuts & Grooming", phone: "(555) 890-1234", stationNumber: 7, isWorking: true }
];

export const get = query({
  handler: async (ctx) => {
    const list = await ctx.db.query("barbers").collect();
    // Return sorted by station number
    return list.sort((a, b) => a.stationNumber - b.stationNumber);
  }
});

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("barbers").collect();
    if (existing.length === 0) {
      for (const b of DEFAULT_TEAM) {
        await ctx.db.insert("barbers", b);
      }
    }
  }
});

export const add = mutation({
  args: {
    name: v.string(),
    specialty: v.string(),
    phone: v.string(),
    stationNumber: v.number(),
    isWorking: v.boolean()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("barbers", args);
  }
});

export const update = mutation({
  args: {
    id: v.id("barbers"),
    name: v.optional(v.string()),
    specialty: v.optional(v.string()),
    phone: v.optional(v.string()),
    stationNumber: v.optional(v.number()),
    isWorking: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  }
});

export const remove = mutation({
  args: { id: v.id("barbers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});
