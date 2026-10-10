import React, { useEffect, useState } from 'react';
import { CheckCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CheckInRecord, ShopConfig } from '../../types';

interface ConfirmationScreenProps {
  record: CheckInRecord;
  config: ShopConfig;
  onDone: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ record, config, onDone }) => {
  const [secondsLeft, setSecondsLeft] = useState(config.autoResetAppointmentSec || 6);
  const totalSeconds = config.autoResetAppointmentSec || 6;

  useEffect(() => {
    // Confetti blast with gold & theme colors
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#D97706', '#10B981', '#FAFAFA', '#18181B']
      });
    } catch {
      // Confetti fallback
    }

    // Auto-reset timer
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDone]);

  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="shopping-welcome-container pop-in" style={{
      maxWidth: '620px',
      margin: '0 auto',
      background: 'var(--surface-card, #18181B)',
      border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
      borderRadius: '32px',
      padding: '40px 28px',
      textAlign: 'center',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Animated Checkmark Bubble */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
          color: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 12px 30px rgba(245, 158, 11, 0.35)'
        }}
        className="bubbly-float"
      >
        <CheckCircle size={48} strokeWidth={2.4} />
      </div>

      <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
        You're All Set, {record.clientName}!
      </h2>

      <p style={{
        fontSize: '1.08rem',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        lineHeight: 1.5,
        margin: '0 auto 28px',
        maxWidth: '400px'
      }}>
        Please have a seat in the waiting area. You will be notified when ready!
      </p>

      {/* Progress Bar */}
      <div className="countdown-container" style={{ marginBottom: 24 }}>
        <div className="countdown-bar-track" style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            className="countdown-bar-fill"
            style={{
              width: `${100 - progressPercent}%`,
              background: 'var(--accent-primary, #F59E0B)',
              height: '100%',
              transition: 'width 1s linear'
            }}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
          Auto-resetting in {secondsLeft}s
        </span>
      </div>

      {/* Done Button */}
      <button
        onClick={onDone}
        className="choice-card-action-btn"
        style={{
          maxWidth: 220,
          margin: '0 auto',
          padding: '12px 24px',
          background: 'var(--surface-pill, #27272A)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
          color: 'var(--text-primary)',
          borderRadius: 9999,
          fontSize: '1rem',
          fontWeight: 750,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <Check size={18} />
        <span>Done</span>
      </button>
    </div>
  );
};
