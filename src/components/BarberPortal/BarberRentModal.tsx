import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, ArrowRight, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Barber, RentPaymentRecord } from '../../types';

interface BarberRentModalProps {
  barber: Barber;
  onPayRent: (barber: Barber, method: RentPaymentRecord['paymentMethod'], feeCovered: boolean) => Promise<RentPaymentRecord>;
  onClose: () => void;
}

export const BarberRentModal: React.FC<BarberRentModalProps> = ({
  barber,
  onPayRent,
  onClose
}) => {
  const baseRent = barber.weeklyRent || 200;
  const feeCovered = true;
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'card'>('apple_pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidRecord, setPaidRecord] = useState<RentPaymentRecord | null>(null);

  const processingFee = feeCovered ? Number(((baseRent * 0.029) + 0.30).toFixed(2)) : 0;
  const totalAmount = baseRent + processingFee;

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    // Simulate crisp 1.2s Stripe payment processing
    setTimeout(async () => {
      const record = await onPayRent(barber, paymentMethod, feeCovered);
      setIsProcessing(false);
      setPaidRecord(record);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#09090B', '#22C55E', '#10B981', '#FFFFFF']
      });
    }, 1200);
  };

  return (
    <div className="modal-overlay">
      <div className="bubbly-modal-card pop-in" style={{ maxWidth: 480, padding: '32px 26px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'transparent',
            border: 'none',
            color: '#71717A',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {!paidRecord ? (
          <div>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#09090B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 900
                }}
              >
                {barber.name.charAt(0)}
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Station #{barber.stationNumber} • Booth Rent
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 850, color: '#09090B', lineHeight: 1.2 }}>
                  Pay Rent for {barber.name}
                </h3>
              </div>
            </div>

            {/* Bill Summary Breakdown */}
            <div
              style={{
                background: '#FAFAFA',
                border: '1px solid #E4E4E7',
                borderRadius: 18,
                padding: '16px 18px',
                marginBottom: 20
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#52525B', marginBottom: 8 }}>
                <span>Weekly Chair Rent:</span>
                <span style={{ fontWeight: 700, color: '#09090B' }}>${baseRent.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#52525B', marginBottom: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Card Processing Fee</span>
                  <span style={{ fontSize: '0.72rem', background: '#E4E4E7', padding: '1px 6px', borderRadius: 4 }}>2.9% + 30¢</span>
                </span>
                <span style={{ fontWeight: 700, color: '#09090B' }}>${processingFee.toFixed(2)}</span>
              </div>

              <div style={{ height: 1, background: '#E4E4E7', margin: '8px 0 12px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 850, color: '#09090B' }}>Total Due:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#09090B' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                Select Payment Method
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: paymentMethod === 'apple_pay' ? '2px solid #09090B' : '1px solid #E4E4E7',
                    background: paymentMethod === 'apple_pay' ? '#F4F4F5' : '#FFFFFF',
                    color: '#09090B',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}></span>
                  <span>Apple Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: paymentMethod === 'card' ? '2px solid #09090B' : '1px solid #E4E4E7',
                    background: paymentMethod === 'card' ? '#F4F4F5' : '#FFFFFF',
                    color: '#09090B',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CreditCard size={17} />
                  <span>Debit / Card</span>
                </button>
              </div>
            </div>

            {/* Security Assurance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#71717A', marginBottom: 22, justifyContent: 'center' }}>
              <Lock size={13} color="#22C55E" />
              <span>256-bit Encrypted direct deposit to shop account</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="choice-card-action-btn"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1.05rem',
                fontWeight: 850,
                borderRadius: 9999
              }}
            >
              {isProcessing ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <span>Pay ${totalAmount.toFixed(2)}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Payment Receipt Screen */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#09090B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle size={40} color="#22C55E" />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#09090B', marginBottom: 4 }}>
              Rent Paid Successfully!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#71717A', marginBottom: 20 }}>
              Your booth rent has been credited and verified in the shop ledger.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: '#FAFAFA',
                border: '1px solid #E4E4E7',
                borderRadius: 18,
                padding: '16px 18px',
                textAlign: 'left',
                marginBottom: 24,
                fontSize: '0.88rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#71717A' }}>Receipt Number:</span>
                <span style={{ fontWeight: 800, color: '#09090B' }}>{paidRecord.receiptNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#71717A' }}>Barber:</span>
                <span style={{ fontWeight: 800, color: '#09090B' }}>{paidRecord.barberName} (Station #{paidRecord.stationNumber})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#71717A' }}>Amount Paid:</span>
                <span style={{ fontWeight: 900, color: '#22C55E' }}>${paidRecord.totalPaid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#71717A' }}>Date & Time:</span>
                <span style={{ fontWeight: 700, color: '#09090B' }}>
                  {new Date(paidRecord.paidAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="choice-card-action-btn"
              style={{ width: '100%', padding: '14px 20px', fontSize: '1rem', borderRadius: 9999 }}
            >
              <span>Back to Barber Hub</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
