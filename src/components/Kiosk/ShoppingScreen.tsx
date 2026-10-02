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
        origin: { y: 0.6 },
        colors: ['#09090B', '#27272A', '#71717A', '#D4D4D8', '#FFFFFF']
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
            style={{ margin: '0 auto 20px', width: 92, height: 92, borderRadius: 30, background: '#09090B', color: '#FFFFFF' }}
          >
            <ShoppingBag size={46} strokeWidth={2.2} />
          </div>

          <h2 className="shopping-main-title">
            Welcome to OF Supply Store!
          </h2>
          
          <p style={{ fontSize: '1.15rem', color: '#52525B', lineHeight: 1.5, marginBottom: '24px', fontWeight: 500 }}>
            Feel free to browse all our barber supplies, clippers, blades, and grooming products.
          </p>

          {/* Prominent Reminder Card */}
          <div
            style={{
              background: '#F4F4F5',
              border: '1px solid #E4E4E7',
              borderRadius: 20,
              padding: '18px 20px',
              textAlign: 'left',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: '#09090B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#09090B', marginBottom: 3 }}>
                When You're Ready to Checkout:
              </div>
              <div style={{ fontSize: '0.88rem', color: '#52525B', lineHeight: 1.4 }}>
                Please return to this screen and tap <strong>"Ready to Checkout"</strong> so our team can meet you at the register to ring you up!
              </div>
            </div>
          </div>

          {/* Auto Reset Progress Bar */}
          <div className="countdown-container" style={{ marginBottom: '24px' }}>
            <div className="countdown-bar-track" style={{ height: 8 }}>
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
            style={{ margin: '0 auto 20px', width: 92, height: 92, borderRadius: 30, background: '#09090B', color: '#FFFFFF' }}
          >
            <CreditCard size={46} strokeWidth={2.2} />
          </div>

          <h2 className="shopping-main-title">
            Staff Notified for Checkout!
          </h2>
          
          <p style={{ fontSize: '1.2rem', color: '#09090B', fontWeight: 750, lineHeight: 1.4, marginBottom: '12px' }}>
            A team member is on their way to the front register to check you out.
          </p>

          <p style={{ fontSize: '0.95rem', color: '#52525B', marginBottom: 28 }}>
            Please bring your items to the front counter. Thank you for shopping with OF!
          </p>

          {/* Auto Reset Progress Bar */}
          <div className="countdown-container" style={{ marginBottom: '24px' }}>
            <div className="countdown-bar-track" style={{ height: 8 }}>
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
