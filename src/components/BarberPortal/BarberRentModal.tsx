import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Banknote,
  Check,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Barber, RentPaymentRecord, ShopConfig } from '../../types';

interface BarberRentModalProps {
  barber: Barber;
  config?: ShopConfig;
  existingRecord?: RentPaymentRecord | null;
  onPayRent: (barber: Barber, method: RentPaymentRecord['paymentMethod'], feeCovered: boolean) => Promise<RentPaymentRecord>;
  onClose: () => void;
}

export const BarberRentModal: React.FC<BarberRentModalProps> = ({
  barber,
  config,
  existingRecord,
  onPayRent,
  onClose
}) => {
  const baseRent = barber.weeklyRent || 200;
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'card' | 'zelle' | 'cash'>('apple_pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidRecord, setPaidRecord] = useState<RentPaymentRecord | null>(existingRecord || null);
  const [isPayingNewCycle, setIsPayingNewCycle] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Fee calculation: Card/Apple Pay pass through 2.9% + 30c; Zelle/Cash is $0 fee
  const isZeroFee = paymentMethod === 'zelle' || paymentMethod === 'cash';
  const processingFee = isZeroFee ? 0 : Number(((baseRent * 0.029) + 0.30).toFixed(2));
  const totalAmount = baseRent + processingFee;

  const showPaymentForm = !paidRecord || isPayingNewCycle;

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Simulate crisp 1.2s Stripe / Apple Pay payment processing
    setTimeout(async () => {
      const record = await onPayRent(barber, paymentMethod, !isZeroFee);
      setIsProcessing(false);
      setPaidRecord(record);
      setIsPayingNewCycle(false);

      confetti({
        particleCount: 65,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF']
      });
    }, 1200);
  };

  const handleCopyReceipt = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
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

        {showPaymentForm ? (
          <div>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: barber.avatarColor || 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  flexShrink: 0
                }}
              >
                {barber.name.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Station #{barber.stationNumber} • Booth Rent
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', margin: '2px 0 0', lineHeight: 1.2 }}>
                  Pay Weekly Rent for {barber.name}
                </h3>
              </div>
            </div>

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
                <span>Weekly Chair Rent:</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${baseRent.toFixed(2)} / wk</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Payment Processing Fee</span>
                  <span style={{ fontSize: '0.7rem', background: 'var(--surface-card)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    {isZeroFee ? '$0.00 Fee' : '2.9% + 30¢'}
                  </span>
                </span>
                <span style={{ fontWeight: 750, color: isZeroFee ? 'var(--pastel-green, #10B981)' : 'var(--text-primary)' }}>
                  {isZeroFee ? 'FREE' : `$${processingFee.toFixed(2)}`}
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle, rgba(255,255,255,0.1))', margin: '8px 0 12px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 850, color: 'var(--text-primary)' }}>Total Due:</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--pastel-green, #10B981)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Sparkles size={11} />
                    <span>Due every {barber.rentDueDay || 'Monday'}</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector (4 Grid Options) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                Select Payment Method
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {/* Apple Pay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 14,
                    border: paymentMethod === 'apple_pay' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'apple_pay' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'apple_pay' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
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

                {/* Stripe Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 14,
                    border: paymentMethod === 'card' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'card' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'card' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <CreditCard size={18} />
                  <span>Card</span>
                </button>

                {/* Zelle */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('zelle')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 14,
                    border: paymentMethod === 'zelle' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'zelle' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'zelle' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={18} />
                  <span>Zelle</span>
                </button>

                {/* Cash to Owner */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 14,
                    border: paymentMethod === 'cash' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'cash' ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-pill)',
                    color: paymentMethod === 'cash' ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Banknote size={18} />
                  <span>Cash</span>
                </button>
              </div>
            </div>

            {/* Simulated Card Details Input if Card selected */}
            {paymentMethod === 'card' && (
              <div 
                className="slide-down"
                style={{
                  background: 'var(--surface-pill, #1C1C21)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  borderRadius: 16,
                  padding: '14px',
                  marginBottom: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Card Information (Stripe Secure)
                  </span>
                  <ShieldCheck size={15} color="#10B981" />
                </div>
                <div>
                  <input
                    type="text"
                    readOnly
                    value="•••• •••• •••• 4242 (Simulated Instant Payout)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--surface-card, #141417)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    style={{
                      padding: '8px 10px',
                      background: 'var(--surface-card, #141417)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      textAlign: 'center'
                    }}
                  />
                  <input
                    type="text"
                    readOnly
                    value="CVC •••"
                    style={{
                      padding: '8px 10px',
                      background: 'var(--surface-card, #141417)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Zelle instructions note */}
            {paymentMethod === 'zelle' && (
              <div 
                className="slide-down"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  marginBottom: 18,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ fontWeight: 800, color: '#60A5FA', marginBottom: 2 }}>⚡ Direct Zelle Transfer ($0 Fee)</div>
                <div>
                  Send <strong>${baseRent.toFixed(2)}</strong> via Zelle to{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {config?.zelleRecipientPhone || config?.zelleRecipientEmail || 'Shop Owner account'}
                  </strong>
                  {config?.zelleRecipientEmail && config?.zelleRecipientPhone ? ` or ${config.zelleRecipientEmail}` : ''}.
                  Clicking Confirm logs your receipt into the shop rent ledger.
                </div>
              </div>
            )}

            {/* Cash instructions note */}
            {paymentMethod === 'cash' && (
              <div 
                className="slide-down"
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 16,
                  padding: '12px 14px',
                  marginBottom: 18,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ fontWeight: 800, color: '#34D399', marginBottom: 2 }}>💵 Handing Cash to Shop Owner</div>
                <div>Hand <strong>${baseRent.toFixed(2)}</strong> cash to the shop manager. Clicking Confirm logs this payment and issues your instant receipt.</div>
              </div>
            )}

            {/* Security Assurance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20, justifyContent: 'center' }}>
              <Lock size={13} color="#10B981" />
              <span>Direct shop account credit & automatic ledger verification</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="choice-card-action-btn"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  fontSize: '1.02rem',
                  fontWeight: 850,
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  border: 'none',
                  cursor: isProcessing ? 'wait' : 'pointer'
                }}
              >
                {isProcessing ? (
                  <span>Processing Rent Payment...</span>
                ) : (
                  <>
                    <span>
                      {paymentMethod === 'cash' ? `Confirm Cash ($${totalAmount.toFixed(2)})` : `Pay $${totalAmount.toFixed(2)}`}
                    </span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {existingRecord && isPayingNewCycle && (
                <button
                  type="button"
                  onClick={() => setIsPayingNewCycle(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                >
                  Cancel & View Last Receipt
                </button>
              )}
            </div>
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
              Booth Rent Verified!
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
              Credited directly to the shop ledger for Station #{paidRecord.stationNumber}.
            </p>

            {/* Official Digital Receipt Card */}
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
                <span style={{ color: 'var(--text-secondary)' }}>Receipt Number:</span>
                <button
                  onClick={() => handleCopyReceipt(paidRecord.receiptNumber)}
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    fontSize: '0.78rem'
                  }}
                  title="Copy Receipt #"
                >
                  <span>{paidRecord.receiptNumber}</span>
                  {copiedReceipt ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Barber:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {paidRecord.barberName} (Station #{paidRecord.stationNumber})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {paidRecord.paymentMethod ? paidRecord.paymentMethod.replace('_', ' ') : 'Apple Pay'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                <span style={{ fontWeight: 900, color: 'var(--pastel-green, #10B981)' }}>
                  ${paidRecord.totalPaid.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date & Time:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {new Date(paidRecord.paidAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--pastel-green, #10B981)', fontSize: '0.75rem', fontWeight: 800 }}>
                <ShieldCheck size={14} />
                <span>Shop Owner Ledger Confirmed</span>
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                className="choice-card-action-btn"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  fontSize: '0.96rem',
                  fontWeight: 850,
                  borderRadius: 9999,
                  background: 'var(--surface-pill, #27272A)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <span>Back to Barber Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPayingNewCycle(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary, #F59E0B)',
                  fontSize: '0.8rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                + Pay Next Week in Advance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
