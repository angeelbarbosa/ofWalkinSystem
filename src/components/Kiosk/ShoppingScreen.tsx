import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, CheckCircle2, CreditCard, Bell } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ShopConfig } from '../../types';

interface ShoppingScreenProps {
  config: ShopConfig;
  mode: 'browsing' | 'checkout';
  onBack: () => void;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({ config, mode, onBack }) => {
  const [secondsLeft, setSecondsLeft] = useState(config.autoResetShoppingSec || 7);
  const totalSeconds = config.autoResetShoppingSec || 7;

  useEffect(() => {
    if (mode === 'checkout') {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBack, totalSeconds, mode]);

  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="shopping-welcome-container pop-in">
      {/* Top back button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 20 }}>
        <button className="back-pill-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {mode === 'browsing' ? (
        <>
          {/* Hero Icon */}
          <div
            className="card-icon-bubble bubbly-float"
            style={{
              margin: '0 auto 20px',
              width: 84,
              height: 84,
              borderRadius: 26,
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--accent-primary, #F59E0B)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ShoppingBag size={42} strokeWidth={2.2} />
          </div>

          <h2 className="shopping-main-title">
            Welcome to {config.shopName}!
          </h2>
          
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px', fontWeight: 500 }}>
            {config.welcomeShoppingBody || 'Feel free to browse all our barber supplies, clippers, blades, and grooming products.'}
          </p>

          {/* Prominent Reminder Card */}
          <div
            style={{
              background: 'var(--surface-pill, #27272A)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 20,
              padding: '16px 18px',
              textAlign: 'left',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'var(--accent-primary-light, rgba(245,158,11,0.15))',
                color: 'var(--accent-primary, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                When You're Ready to Checkout:
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Please return to this screen and tap <strong style={{ color: 'var(--accent-primary)' }}>"Ready to Checkout"</strong> so our team can meet you at the register to ring you up!
              </div>
            </div>
          </div>

          {/* Auto Reset Progress Bar */}
          <div className="countdown-container" style={{ marginBottom: '20px' }}>
            <div className="countdown-bar-track" style={{ height: 6 }}>
              <div
                className="countdown-bar-fill"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
            <span className="countdown-text">
              Auto-closing in {secondsLeft}s
            </span>
          </div>

          {/* Done Button */}
          <button
            onClick={onBack}
            className="choice-card-action-btn"
            style={{ maxWidth: 260, margin: '0 auto' }}
          >
            <CheckCircle2 size={18} />
            <span>Got It, Start Browsing</span>
          </button>
        </>
      ) : (
        <>
          {/* Checkout Alert Confirmed */}
          <div
            className="card-icon-bubble bubbly-float"
            style={{
              margin: '0 auto 20px',
              width: 84,
              height: 84,
              borderRadius: 26,
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              boxShadow: '0 8px 24px rgba(245,158,11,0.35)'
            }}
          >
            <CreditCard size={42} strokeWidth={2.2} />
          </div>

          <h2 className="shopping-main-title">
            Staff Notified for Checkout!
          </h2>
          
          <p style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.4, marginBottom: '10px' }}>
            A team member is on their way to the front register to check you out.
          </p>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Please bring your items to the front counter. Thank you for shopping with us!
          </p>

          {/* Auto Reset Progress Bar */}
          <div className="countdown-container" style={{ marginBottom: '20px' }}>
            <div className="countdown-bar-track" style={{ height: 6 }}>
              <div
                className="countdown-bar-fill"
                style={{ width: `${100 - progressPercent}%` }}
              />
            </div>
            <span className="countdown-text">
              Auto-resetting in {secondsLeft}s
            </span>
          </div>

          {/* Done Button */}
          <button
            onClick={onBack}
            className="choice-card-action-btn"
            style={{ maxWidth: 260, margin: '0 auto' }}
          >
            <CheckCircle2 size={18} />
            <span>Done</span>
          </button>
        </>
      )}
    </div>
  );
};
