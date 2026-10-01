import React, { useEffect, useState } from 'react';
import { CheckCircle, Armchair, Check } from 'lucide-react';
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
    // 1. Monochrome / Silver & Black confetti cannon blast
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#09090B', '#27272A', '#71717A', '#D4D4D8', '#FFFFFF']
    });

    // 2. Auto-reset timer
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
    <div className="shopping-welcome-container pop-in">
      {/* Animated Checkmark Bubble */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 34,
          background: '#09090B',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)'
        }}
        className="bubbly-float"
      >
        <CheckCircle size={52} strokeWidth={2.4} />
      </div>

      <h2 className="shopping-main-title">
        You're All Set, {record.clientName}!
      </h2>

      <p style={{ fontSize: '1.25rem', color: '#09090B', fontWeight: 750, marginBottom: '12px' }}>
        We notified {record.barberName} that you've arrived.
      </p>

      {record.appointmentTime && record.appointmentTime !== 'Appointment' && (
        <div style={{ display: 'inline-block', background: '#F4F4F5', color: '#09090B', padding: '6px 16px', borderRadius: 9999, fontWeight: 700, fontSize: '0.92rem', marginBottom: '20px' }}>
          Appointment Slot: <strong>{record.appointmentTime}</strong>
        </div>
      )}

      {/* Lounge instructions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: '#52525B',
          fontSize: '1.15rem',
          fontWeight: 600,
          marginBottom: 36
        }}
      >
        <Armchair size={24} color="#09090B" />
        <span>Please have a seat in our lounge.</span>
      </div>

      {/* Progress Bar */}
      <div className="countdown-container" style={{ marginBottom: 28 }}>
        <div className="countdown-bar-track" style={{ height: 8 }}>
          <div
            className="countdown-bar-fill"
            style={{ width: `${100 - progressPercent}%`, background: '#09090B' }}
          />
        </div>
        <span className="countdown-text">
          Auto-resetting in {secondsLeft}s
        </span>
      </div>

      {/* Done Button */}
      <button
        onClick={onDone}
        className="choice-card-action-btn"
        style={{ maxWidth: 260, margin: '0 auto' }}
      >
        <Check size={20} />
        <span>Done</span>
      </button>
    </div>
  );
};
