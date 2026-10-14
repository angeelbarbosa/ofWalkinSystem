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
 * - Direct destination payouts to the Shop Owner's connected bank account via Stripe Connect
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
    stripeAccountId: v.optional(v.string()),
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

      // If shop has a connected bank account (Stripe Connect), route directly to their bank
      const hasValidConnectDestination = Boolean(
        args.stripeAccountId && 
        args.stripeAccountId.startsWith("acct_") && 
        !args.customSecretKey
      );

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
          subscription_data: hasValidConnectDestination ? {
            transfer_data: {
              destination: args.stripeAccountId!
            }
          } : undefined,
          metadata: {
            shopSlug: args.shopSlug,
            barberId: args.barberId,
            barberName: args.barberName,
            weeksCovered: String(args.weeksCovered),
            isAutoPay: "true",
            stripeAccountId: args.stripeAccountId || ""
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
          payment_intent_data: hasValidConnectDestination ? {
            transfer_data: {
              destination: args.stripeAccountId!
            }
          } : undefined,
          metadata: {
            shopSlug: args.shopSlug,
            barberId: args.barberId,
            barberName: args.barberName,
            weeksCovered: String(args.weeksCovered),
            isAutoPay: "false",
            stripeAccountId: args.stripeAccountId || ""
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
      console.error("Stripe createRentCheckoutSession error:", err);
      return {
        success: false,
        error: err.message || "Failed to create Stripe Checkout session",
        url: null,
        sessionId: null
      };
    }
  }
});

/**
 * Creates an official Stripe Connect Account & Onboarding Link.
 * This redirects the shop owner to Stripe's secure page to enter their bank routing/account number or debit card.
 */
export const createConnectAccountLink = action({
  args: {
    shopSlug: v.string(),
    shopName: v.string(),
    existingAccountId: v.optional(v.string()),
    returnUrl: v.string(),
    refreshUrl: v.string(),
    customSecretKey: v.optional(v.string())
  },
  handler: async (_ctx, args) => {
    const stripe = getStripeClient(args.customSecretKey);
    if (!stripe) {
      return { 
        success: false, 
        error: "Stripe Secret Key not configured", 
        url: null, 
        accountId: null, 
        needsConnectSignup: false 
      };
    }

    try {
      let accountId = args.existingAccountId;

      // Create new Stripe Express account if shop doesn't have an ID yet
      if (!accountId || !accountId.startsWith("acct_")) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          business_type: "individual",
          capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true }
          },
          business_profile: {
            name: args.shopName,
            product_description: `Barbershop booth rent payouts for ${args.shopName}`
          }
        });
        accountId = account.id;
      }

      // Generate a secure Stripe-hosted onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: args.refreshUrl,
        return_url: `${args.returnUrl}&account_id=${accountId}`,
        type: "account_onboarding"
      });

      return {
        success: true,
        url: accountLink.url,
        accountId,
        error: null,
        needsConnectSignup: false
      };
    } catch (err: any) {
      const msg = err.message || "";
      const isConnectNotEnabled = msg.includes("signed up for Connect") || msg.includes("Connect");
      return {
        success: false,
        error: msg,
        url: null,
        accountId: null,
        needsConnectSignup: isConnectNotEnabled
      };
    }
  }
});

/**
 * Checks the status of a connected Stripe Express bank account
 */
export const getConnectedAccountStatus = action({
  args: {
    accountId: v.string(),
    customSecretKey: v.optional(v.string())
  },
  handler: async (_ctx, args) => {
    const stripe = getStripeClient(args.customSecretKey);
    if (!stripe || !args.accountId || !args.accountId.startsWith("acct_")) {
      return { success: false, connected: false, bankName: null, error: "Invalid account or key" };
    }

    try {
      const account = await stripe.accounts.retrieve(args.accountId);
      const bank = account.external_accounts?.data?.[0] as any;
      const bankName = bank ? `${bank.bank_name || 'Bank'} (•••• ${bank.last4 || '••••'})` : "Connected Checking Account";
      const isComplete = account.charges_enabled && account.payouts_enabled;

      return {
        success: true,
        connected: Boolean(isComplete || account.details_submitted),
        bankName,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        error: null
      };
    } catch (err: any) {
      return {
        success: false,
        connected: false,
        bankName: null,
        error: err.message
      };
    }
  }
});

/**
 * Verifies a completed Stripe Checkout session upon customer return redirect.
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
        error: "Stripe not configured",
        amountTotal: 0,
        customerEmail: null,
        metadata: null
      };
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(args.sessionId);
      const isPaid = session.payment_status === "paid" || session.status === "complete";

      return {
        success: true,
        paid: isPaid,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        customerEmail: session.customer_details?.email,
        metadata: session.metadata
      };
    } catch (err: any) {
      return {
        success: false,
        paid: false,
        error: err.message || "Failed to retrieve session",
        amountTotal: 0,
        customerEmail: null,
        metadata: null
      };
    }
  }
});

/**
 * Creates a Stripe Checkout Session for the Shop Owner paying the WalkinApp Platform monthly fee.
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
