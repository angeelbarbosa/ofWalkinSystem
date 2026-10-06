import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_CONFIG = {
  shopName: "OF Supply & Lounge",
  welcomeShoppingBody: "Feel free to browse around. Let us know when you are ready to checkout!",
  autoResetShoppingSec: 6,
  autoResetAppointmentSec: 6,
  soundAlertsEnabled: true,
  pinCode: "1234"
};

export const get = query({
  handler: async (ctx) => {
    const config = await ctx.db.query("shopConfig").first();
    return config || DEFAULT_CONFIG;
  }
});

export const update = mutation({
  args: {
    shopName: v.optional(v.string()),
    welcomeShoppingBody: v.optional(v.string()),
    autoResetShoppingSec: v.optional(v.number()),
    autoResetAppointmentSec: v.optional(v.number()),
    soundAlertsEnabled: v.optional(v.boolean()),
    pinCode: v.optional(v.string()),
    themeId: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    shopsJson: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("shopConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("shopConfig", {
        ...DEFAULT_CONFIG,
        ...args
      });
    }
  }
});
