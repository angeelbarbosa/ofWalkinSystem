import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { ShopConfig } from '../../types';

interface ShoppingScreenProps {
  config: ShopConfig;
  onBack: () => void;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({ config, onBack }) => {
  const [secondsLeft, setSecondsLeft] = useState(config.autoResetShoppingSec || 6);
  const totalSeconds = config.autoResetShoppingSec || 6;

  useEffect(() => {
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
  }, [onBack, totalSeconds]);

  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="shopping-welcome-container pop-in">
      {/* Top back button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 24 }}>
        <button className="back-pill-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Icon */}
      <div
        className="card-icon-bubble bubbly-float"
        style={{ margin: '0 auto 24px', width: 96, height: 96, borderRadius: 32, background: '#09090B', color: '#FFFFFF' }}
      >
        <ShoppingBag size={48} strokeWidth={2.2} />
      </div>

      <h2 className="shopping-main-title">
        Welcome In!
      </h2>
      
      <p style={{ fontSize: '1.25rem', color: '#52525B', lineHeight: 1.5, marginBottom: '36px', fontWeight: 500 }}>
        Feel free to browse around.<br />
        Let us know when you are ready to checkout!
      </p>

      {/* Auto Reset Progress Bar */}
      <div className="countdown-container" style={{ marginBottom: '28px' }}>
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
        <CheckCircle2 size={20} />
        <span>Got It!</span>
      </button>
    </div>
  );
};
