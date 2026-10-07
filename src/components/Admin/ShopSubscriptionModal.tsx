import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  Shield, 
  Sparkles, 
  Calendar,
  AlertCircle,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Shop, SubscriptionPaymentMethod } from '../../types';

interface ShopSubscriptionModalProps {
  shop: Shop;
  onPaySubscription: (paymentMethod: SubscriptionPaymentMethod) => void;
  onClose: () => void;
}

export const ShopSubscriptionModal: React.FC<ShopSubscriptionModalProps> = ({
  shop,
  onPaySubscription,
  onClose
}) => {
  const baseFee = shop.subscriptionMonthlyFee ?? shop.monthlyPlanPrice ?? 49;
  const isComped = shop.subscriptionStatus === 'comped' || baseFee === 0;
  
  // Stripe Processing Fee: 2.9% + $0.30 passed through
  const processingFee = isComped ? 0 : Number(((baseFee * 0.029) + 0.30).toFixed(2));
  const totalAmount = Number((baseFee + processingFee).toFixed(2));

  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState<{
    invoiceNumber: string;
    paidAt: string;
    totalPaid: number;
    method: string;
    nextBillingDate: string;
  } | null>(null);

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Simulate crisp 1.2s dynamic Stripe & Apple Pay subscription checkout
    setTimeout(() => {
      onPaySubscription('apple_pay');
      setIsProcessing(false);

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);

      setPaidReceipt({
        invoiceNumber: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        paidAt: new Date().toISOString(),
        totalPaid: totalAmount,
        method: 'Stripe / Apple Pay',
        nextBillingDate: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']
      });
    }, 1200);
  };

  const handleCopyInvoice = (inv: string) => {
    navigator.clipboard.writeText(inv);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="bubbly-modal-card pop-in" 
        style={{ 
          maxWidth: 480, 
          padding: '28px 24px', 
          position: 'relative',
          background: 'var(--surface-card, #141417)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)'
        }}
      >
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  flexShrink: 0
                }}
              >
                <Shield size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Platform SaaS License
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', margin: '2px 0 0', lineHeight: 1.2 }}>
                  {shop.name} Subscription
                </h3>
              </div>
            </div>

            {/* Status Alert Banner */}
            {shop.subscriptionStatus === 'past_due' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 14,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--pastel-red, #EF4444)',
                fontSize: '0.82rem',
                fontWeight: 750
              }}>
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>Subscription renewal is past due. Renew now to maintain uninterrupted kiosk access.</span>
              </div>
            )}

            {/* Bill Summary Breakdown */}
            <div
              style={{
                background: 'var(--surface-pill, #1C1C21)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: 18,
                padding: '16px 18px',
                marginBottom: 18
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span>Monthly Software Access:</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${baseFee.toFixed(2)} / mo</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Stripe Processing Fee</span>
                  <span style={{ fontSize: '0.68rem', background: 'var(--surface-card)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    2.9% + 30¢
                  </span>
                </span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${processingFee.toFixed(2)}</span>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle, rgba(255,255,255,0.1))', margin: '8px 0 12px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 850, color: 'var(--text-primary)' }}>Total Due Today:</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--pastel-green, #10B981)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Sparkles size={11} />
                    <span>Includes Kiosk, Booth Rent & Live Queue</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Auto-Renewal Notice */}
            <div style={{
              background: 'var(--surface-pill, #1C1C21)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Calendar size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Recurring monthly subscription billed to your card on file every 30 days via Stripe. Cancel anytime from Shop Admin.
              </div>
            </div>

            {/* Security Assurance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 18, justifyContent: 'center' }}>
              <Lock size={12} color="#10B981" />
              <span>Direct encrypted checkout powered by Stripe Billing</span>
            </div>

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
                  <span>Processing Stripe Subscription...</span>
                ) : (
                  <>
                    <Smartphone size={18} />
                    <span>Subscribe with Apple Pay / Card • ${totalAmount.toFixed(2)}/mo</span>
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
      </div>
    </div>
  );
};
