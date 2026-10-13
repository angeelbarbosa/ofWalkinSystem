"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";

// Helper to instantiate Stripe client safely
function getStripeClient(customKey?: string): Stripe | null {
  const secretKey = customKey || process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia" as any
  });
}

/**
 * Creates a dynamic Stripe Checkout Session for Barber Booth Rent.
 * Supports:
 * - Exact per-barber rent amounts ($150, $200, $250, etc.)
 * - Weekly recurring auto-pay subscriptions OR one-time multi-cycle payments
 * - Apple Pay, Google Pay, Credit & Debit Cards
 */
export const createRentCheckoutSession = action({
  args: {
    shopSlug: v.string(),
    shopName: v.string(),
    barberId: v.string(),
    barberName: v.string(),
    baseRentAmount: v.number(), // in dollars
    feeAmount: v.number(),      // in dollars
    weeksCovered: v.number(),
    isAutoPay: v.boolean(),
    successUrl: v.string(),
    cancelUrl: v.string(),
    customSecretKey: v.optional(v.string())
  },
  handler: async (_ctx, args) => {
    const stripe = getStripeClient(args.customSecretKey);
    if (!stripe) {
      return {
        success: false,
        error: "Stripe Secret Key not configured. Please add your Stripe Secret Key (sk_live_... or sk_test_...) in Settings.",
        url: null,
        sessionId: null
      };
    }

    try {
      const totalCents = Math.round((args.baseRentAmount + args.feeAmount) * 100);

      if (args.isAutoPay) {
        // Recurring Weekly Subscription
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${args.shopName} — Weekly Rent (${args.barberName})`,
                  description: `Weekly booth rent auto-pay for ${args.barberName}. Billed every week.`
                },
                unit_amount: totalCents,
                recurring: {
                  interval: "week",
                  interval_count: 1
                }
              },
              quantity: 1
            }
          ],
          metadata: {
            shopSlug: args.shopSlug,
            barberId: args.barberId,
            barberName: args.barberName,
            weeksCovered: String(args.weeksCovered),
            isAutoPay: "true"
          },
          success_url: args.successUrl,
          cancel_url: args.cancelUrl
        });

        return {
          success: true,
          url: session.url,
          sessionId: session.id,
          error: null
        };
      } else {
        // One-time payment (covers single or multiple caught-up cycles)
        const cycleText = args.weeksCovered > 1 ? `${args.weeksCovered} Weekly Cycles` : "1 Weekly Cycle";
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${args.shopName} — Booth Rent (${args.barberName})`,
                  description: `Booth rent payment (${cycleText})`
                },
                unit_amount: totalCents
              },
              quantity: 1
            }
          ],
          metadata: {
            shopSlug: args.shopSlug,
            barberId: args.barberId,
            barberName: args.barberName,
            weeksCovered: String(args.weeksCovered),
            isAutoPay: "false"
          },
          success_url: args.successUrl,
          cancel_url: args.cancelUrl
        });

        return {
          success: true,
          url: session.url,
          sessionId: session.id,
          error: null
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to create Stripe Checkout Session",
        url: null,
        sessionId: null
      };
    }
  }
});

/**
 * Verifies a Stripe Checkout Session upon return from Stripe.
 */
export const verifyCheckoutSession = action({
  args: {
    sessionId: v.string(),
    customSecretKey: v.optional(v.string())
  },
  handler: async (_ctx, args) => {
    const stripe = getStripeClient(args.customSecretKey);
    if (!stripe) {
      return {
        success: false,
        paid: false,
        error: "Stripe Secret Key not configured"
      };
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(args.sessionId);
      const isPaid = session.payment_status === "paid";

      return {
        success: true,
        paid: isPaid,
        status: session.status,
        customerEmail: session.customer_details?.email,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        metadata: session.metadata,
        error: null
      };
    } catch (err: any) {
      return {
        success: false,
        paid: false,
        error: err.message || "Failed to verify Stripe Session"
      };
    }
  }
});

/**
 * Creates a Stripe Checkout Session for Shop Platform Subscription ($49/mo).
 */
export const createShopSubscriptionSession = action({
  args: {
    shopSlug: v.string(),
    shopName: v.string(),
    ownerEmail: v.optional(v.string()),
    monthlyPrice: v.number(),
    feeAmount: v.number(),
    successUrl: v.string(),
    cancelUrl: v.string(),
    customSecretKey: v.optional(v.string())
  },
  handler: async (_ctx, args) => {
    const stripe = getStripeClient(args.customSecretKey);
    if (!stripe) {
      return {
        success: false,
        error: "Stripe Secret Key not configured",
        url: null,
        sessionId: null
      };
    }

    try {
      const totalCents = Math.round((args.monthlyPrice + args.feeAmount) * 100);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: args.ownerEmail || undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `WalkinApp Platform — ${args.shopName}`,
                description: `Monthly shop license, multi-device sync, and booth rent automation.`
              },
              unit_amount: totalCents,
              recurring: {
                interval: "month",
                interval_count: 1
              }
            },
            quantity: 1
          }
        ],
        metadata: {
          shopSlug: args.shopSlug,
          type: "platform_subscription"
        },
        success_url: args.successUrl,
        cancel_url: args.cancelUrl
      });

      return {
        success: true,
        url: session.url,
        sessionId: session.id,
        error: null
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to create Subscription Session",
        url: null,
        sessionId: null
      };
    }
  }
});
