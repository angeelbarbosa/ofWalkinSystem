import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Copy,
  Smartphone,
  RefreshCw
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
  config: _config,
  existingRecord,
  onPayRent,
  onClose
}) => {
  const baseRent = barber.weeklyRent || barber.rentAmount || 200;
  const rentCycleText = barber.rentCycle === 'monthly' ? 'Monthly' : barber.rentCycle === 'biweekly' ? 'Bi-Weekly' : 'Weekly';
  
  // Card/Apple Pay standard processing fee (2.9% + 30¢)
  const processingFee = Number(((baseRent * 0.029) + 0.30).toFixed(2));
  const totalAmount = Number((baseRent + processingFee).toFixed(2));

  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPayEnabled, setAutoPayEnabled] = useState(barber.autoPayEnabled ?? true);
  const [paidRecord, setPaidRecord] = useState<RentPaymentRecord | null>(existingRecord || null);
  const [isPayingNewCycle, setIsPayingNewCycle] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const showPaymentForm = !paidRecord || isPayingNewCycle;

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Simulate crisp 1.2s Stripe & Apple Pay payment processing
    setTimeout(async () => {
      const record = await onPayRent(barber, 'apple_pay', true);
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

        {showPaymentForm ? (
          <div>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  background: barber.avatarColor || 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
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
                  Pay Booth Rent ({barber.name})
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
                <span>{rentCycleText} Station Rent:</span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>${baseRent.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Card / Apple Pay Processing</span>
                  <span style={{ fontSize: '0.68rem', background: 'var(--surface-card)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                    2.9% + 30¢
                  </span>
                </span>
                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>
                  ${processingFee.toFixed(2)}
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
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Auto-Pay Switcher */}
            <div 
              style={{
                background: 'var(--surface-pill, #1C1C21)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                cursor: 'pointer'
              }}
              onClick={() => setAutoPayEnabled(!autoPayEnabled)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: autoPayEnabled ? 'var(--pastel-green-bg)' : 'var(--surface-card)',
                  color: autoPayEnabled ? 'var(--pastel-green)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RefreshCw size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Automatic Rent Renewal
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Auto-charge saved card every {barber.rentDueDay || 'Monday'}
                  </div>
                </div>
              </div>

              <input 
                type="checkbox" 
                checked={autoPayEnabled} 
                onChange={(e) => setAutoPayEnabled(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }} 
              />
            </div>

            {/* Security Assurance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 18, justifyContent: 'center' }}>
              <Lock size={12} color="#10B981" />
              <span>Direct shop account deposit • 256-bit encrypted via Stripe</span>
            </div>

            {/* One Big Primary Payment Button */}
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
                  <span>Processing Stripe Payment...</span>
                ) : (
                  <>
                    <Smartphone size={18} />
                    <span>Pay with Apple Pay / Card • ${totalAmount.toFixed(2)}</span>
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
                    padding: '8px'
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
              Paid via Stripe and credited directly to the shop ledger for Station #{paidRecord.stationNumber}.
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
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CreditCard size={13} style={{ color: 'var(--pastel-green)' }} />
                  <span>Stripe / Apple Pay</span>
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
                <span>Back to Barber Station</span>
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
                + Pay Next Cycle in Advance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
