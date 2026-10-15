import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  Shield, 
  Calendar,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import type { Shop, SubscriptionPaymentMethod } from '../../types';
import { ModalOverlay } from '../Shared/ModalOverlay';
import { convexClient } from '../../utils/convexClient';
import { api } from '../../../convex/_generated/api';

interface ShopSubscriptionModalProps {
  shop: Shop;
  onPaySubscription: (paymentMethod: SubscriptionPaymentMethod) => void;
  onClose: () => void;
}

export const ShopSubscriptionModal: React.FC<ShopSubscriptionModalProps> = ({
  shop,
  onPaySubscription: _onPaySubscription,
  onClose
}) => {
  const baseFee = shop.subscriptionMonthlyFee ?? shop.monthlyPlanPrice ?? 49;
  const isComped = shop.subscriptionStatus === 'comped' || baseFee === 0;
  
  // Stripe Processing Fee: 2.9% + $0.30 passed through
  const processingFee = isComped ? 0 : Number(((baseFee * 0.029) + 0.30).toFixed(2));
  const totalAmount = Number((baseFee + processingFee).toFixed(2));

  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paidReceipt] = useState<{
    invoiceNumber: string;
    paidAt: string;
    totalPaid: number;
    method: string;
    nextBillingDate: string;
  } | null>(null);

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    if (!convexClient) {
      setErrorMessage('Payment service connecting... Please try again.');
      setIsProcessing(false);
      return;
    }

    try {
      const origin = window.location.origin;
      const res = await convexClient.action(api.stripe.createShopSubscriptionSession, {
        shopSlug: shop.slug,
        shopName: shop.name,
        ownerEmail: shop.ownerEmail || undefined,
        monthlyPrice: baseFee,
        feeAmount: processingFee,
        successUrl: `${origin}/?shop=${shop.slug}&portal=admin&payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/?shop=${shop.slug}&portal=admin&payment=cancel`,
        customSecretKey: shop.config?.stripeSecretKey || undefined
      });

      if (res?.success && res?.url) {
        window.location.assign(res.url);
        return;
      } else {
        setErrorMessage(res?.error || 'Unable to launch Stripe checkout. Please try again.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Stripe subscription session error:', err);
      setErrorMessage(err?.message || 'Error connecting to Stripe Checkout.');
      setIsProcessing(false);
    }
  };

  const handleCopyInvoice = (inv: string) => {
    navigator.clipboard.writeText(inv);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={480}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'var(--surface-pill, #27272A)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted, #71717A)',
            cursor: 'pointer'
          }}
        >
          <X size={17} />
        </button>

        {!paidReceipt ? (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Shield size={22} />
              </div>
              <h3 style={{ fontSize: '1.20rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {shop.name} Subscription
              </h3>
            </div>

            {/* Status Alert Banner */}
            {shop.subscriptionStatus === 'past_due' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 12,
                padding: '8px 12px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--pastel-red, #EF4444)',
                fontSize: '0.80rem',
                fontWeight: 700
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Subscription past due. Renew now to keep access active.</span>
              </div>
            )}

            {/* Bill Summary Breakdown */}
            <div
              style={{
                background: 'var(--surface-pill, #1C1C21)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: 16,
                padding: '16px 18px',
                marginBottom: 14
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Monthly Plan</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${baseFee.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                <span>Processing Fee</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${processingFee.toFixed(2)}</span>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle, rgba(255,255,255,0.1))', margin: '8px 0 10px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 850, color: 'var(--text-primary)' }}>Total Due</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Renewal Note */}
            <div style={{
              background: 'var(--surface-pill, #1C1C21)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Calendar size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Billed monthly • Cancel anytime
              </div>
            </div>

            {/* Security Assurance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 14, justifyContent: 'center' }}>
              <Lock size={11} color="#10B981" />
              <span>Encrypted via Stripe</span>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--status-error, #EF4444)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: 10
              }}>
                {errorMessage}
              </div>
            )}

            {/* One Big Primary Subscription Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  border: 'none',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
                }}
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Pay ${totalAmount.toFixed(2)}</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Payment Invoice Receipt Screen */
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid var(--pastel-green, #10B981)',
                color: 'var(--pastel-green, #10B981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px'
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
              Subscription Renewed!
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
              {shop.name} is fully active through {paidReceipt.nextBillingDate}.
            </p>

            {/* Official Digital Invoice Card */}
            <div
              style={{
                background: 'var(--surface-pill, #1C1C21)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: 18,
                padding: '16px 18px',
                textAlign: 'left',
                marginBottom: 20,
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoice Number:</span>
                <button
                  onClick={() => handleCopyInvoice(paidReceipt.invoiceNumber)}
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    fontWeight: 850,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    fontSize: '0.78rem'
                  }}
                  title="Copy Invoice #"
                >
                  <span>{paidReceipt.invoiceNumber}</span>
                  {copiedInvoice ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shop Name:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{shop.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CreditCard size={13} style={{ color: 'var(--pastel-green)' }} />
                  <span>Stripe / Apple Pay</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                <span style={{ fontWeight: 900, color: 'var(--pastel-green, #10B981)' }}>
                  ${paidReceipt.totalPaid.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Next Billing Date:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {paidReceipt.nextBillingDate}
                </span>
              </div>
            </div>

            {/* Footer Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '0.96rem',
                fontWeight: 850,
                borderRadius: 16,
                background: 'var(--surface-pill, #27272A)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              <span>Back to Shop Admin</span>
            </button>
          </div>
        )}
    </ModalOverlay>
  );
};
