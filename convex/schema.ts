import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  barbers: defineTable({
    name: v.string(),
    nickname: v.optional(v.string()),
    specialty: v.string(),
    phone: v.string(),
    stationNumber: v.number(),
    isWorking: v.boolean(),
    avatarColor: v.optional(v.string())
  }),

  checkIns: defineTable({
    clientName: v.string(),
    clientPhone: v.optional(v.string()),
    type: v.string(), // 'appointment' | 'shopping'
    barberId: v.optional(v.string()),
    barberName: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    checkInTime: v.string(),
    status: v.string(), // 'waiting' | 'called' | 'in_chair' | 'completed'
    notes: v.optional(v.string())
  }),

  shopConfig: defineTable({
    shopName: v.string(),
    welcomeShoppingBody: v.string(),
    autoResetShoppingSec: v.number(),
    autoResetAppointmentSec: v.number(),
    soundAlertsEnabled: v.boolean(),
    pinCode: v.string(),
    themeId: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    shopsJson: v.optional(v.string())
  }),

  pushSubscriptions: defineTable({
    barberId: v.string(),
    barberName: v.string(),
    endpoint: v.string(),
    auth: v.string(),
    p256dh: v.string(),
    updatedAt: v.string()
  }).index("by_endpoint", ["endpoint"])
});

