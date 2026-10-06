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
  AlertCircle
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
  
  // Stripe Processing Fee: 2.9% + $0.30 passed to shop owner
  const processingFee = isComped ? 0 : Number(((baseFee * 0.029) + 0.30).toFixed(2));
  const totalAmount = baseFee + processingFee;

  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'card' | 'zelle'>('apple_pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidReceipt, setPaidReceipt] = useState<{
    invoiceNumber: string;
    paidAt: string;
    totalPaid: number;
    method: string;
    nextBillingDate: string;
  } | null>(null);

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    setTimeout(() => {
      onPaySubscription(paymentMethod);
      setIsProcessing(false);

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);

      setPaidReceipt({
        invoiceNumber: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        paidAt: new Date().toISOString(),
        totalPaid: totalAmount,
        method: paymentMethod === 'apple_pay' ? 'Apple Pay' : paymentMethod === 'card' ? 'Stripe Card' : 'Zelle Transfer',
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

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="bubbly-modal-card pop-in" 
        style={{ 
          maxWidth: 490, 
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
                  width: 44,
                  height: 44,
                  borderRadius: 14,
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
                <span>Monthly Platform Access:</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${baseFee.toFixed(2)} / mo</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Stripe Processing Fee</span>
                  <span style={{ fontSize: '0.7rem', background: 'var(--surface-card)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
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
                    <span>Includes Kiosk, Booth Rent, & SMS Gateway</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                Select Payment Method
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  style={{
                    padding: '11px 8px',
                    borderRadius: 14,
                    border: paymentMethod === 'apple_pay' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'apple_pay' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'apple_pay' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}></span>
                  <span>Apple Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '11px 8px',
                    borderRadius: 14,
                    border: paymentMethod === 'card' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'card' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'card' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <CreditCard size={18} />
                  <span>Stripe Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('zelle')}
                  style={{
                    padding: '11px 8px',
                    borderRadius: 14,
                    border: paymentMethod === 'zelle' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'zelle' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'zelle' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>Zelle</span>
                  <span>Direct Bank</span>
                </button>
              </div>
            </div>

            {/* Security Assurance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 18, justifyContent: 'center' }}>
              <Lock size={12} color="var(--pastel-green, #10B981)" />
              <span>256-bit Encrypted direct deposit to Platform HQ</span>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1rem',
                fontWeight: 850,
                borderRadius: 9999,
                background: 'var(--accent-primary)',
                color: 'var(--bg-main)',
                border: 'none',
                cursor: isProcessing ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.2s ease'
              }}
            >
              {isProcessing ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <span>Pay ${totalAmount.toFixed(2)} with {paymentMethod === 'apple_pay' ? 'Apple Pay' : paymentMethod === 'card' ? 'Stripe Card' : 'Zelle'}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Payment Receipt Screen */
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--pastel-green, #10B981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px'
              }}
            >
              <CheckCircle size={38} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Subscription Paid!
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 18px' }}>
              Your shop license has been renewed and verified in Platform HQ.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: 'var(--surface-pill, #1C1C21)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: 18,
                padding: '16px 18px',
                textAlign: 'left',
                marginBottom: 20,
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoice Number:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{paidReceipt.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shop Name:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{shop.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Plan:</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>Monthly Platform SaaS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                <span style={{ fontWeight: 750, color: 'var(--accent-primary)' }}>{paidReceipt.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                <span style={{ fontWeight: 900, color: 'var(--pastel-green, #10B981)' }}>${paidReceipt.totalPaid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 7, marginTop: 4 }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} />
                  <span>Next Renewal:</span>
                </span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{paidReceipt.nextBillingDate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ 
                width: '100%', 
                padding: '13px 20px', 
                fontSize: '0.95rem', 
                fontWeight: 800,
                borderRadius: 9999,
                background: 'var(--surface-pill)',
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
