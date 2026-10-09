import React, { useState } from 'react';
import { 
  Scissors, 
  Lock, 
  ArrowLeft, 
  AlertCircle
} from 'lucide-react';
import type { Barber } from '../../types';

interface BarberLoginScreenProps {
  barbers: Barber[];
  onLoginSuccess: (barber: Barber) => void;
  onBackToKiosk: () => void;
}

export const BarberLoginScreen: React.FC<BarberLoginScreenProps> = ({
  barbers,
  onLoginSuccess,
  onBackToKiosk
}) => {
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const activeBarbers = barbers.filter(b => b.isWorking);

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setPin('');
    setError(false);
  };

  const handleDigit = (digit: string) => {
    if (!selectedBarber || pin.length >= 4) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);

    if (nextPin.length === 4) {
      const expectedPasscode = selectedBarber.passcode || '1111';
      if (nextPin === expectedPasscode) {
        // Successful login
        setTimeout(() => {
          onLoginSuccess(selectedBarber);
        }, 150);
      } else {
        // Wrong PIN
        setError(true);
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 650);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="pop-in" style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '0 8px' }}>
      {/* 1. If NO barber is selected yet: Show Barber Station Roster */}
      {!selectedBarber ? (
        <div>
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background: 'var(--surface-pill, #27272A)',
                color: 'var(--accent-primary, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))'
              }}
            >
              <Scissors size={26} />
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Barber Hub Access
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
              Select your name
            </p>
          </div>

          {/* Barbers Grid (Responsive 2-col or 1-col on mobile) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 24
            }}
          >
            {activeBarbers.map((barber) => (
              <div
                key={barber.id}
                onClick={() => handleSelectBarber(barber)}
                className="slide-up"
                style={{
                  padding: '18px 16px',
                  borderRadius: 20,
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                  background: 'var(--surface-card, #18181B)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Lock Indicator */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--surface-pill, #27272A)',
                      color: 'var(--text-muted, #71717A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="PIN Protected"
                  >
                    <Lock size={12} />
                  </div>
                </div>

                {/* Avatar & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {barber.name}
                    </h3>
                  </div>
                </div>

                {/* Tap to Unlock Indicator */}
                <div
                  style={{
                    width: '100%',
                    marginTop: 4,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: 'var(--accent-primary, #F59E0B)'
                  }}
                >
                  <span>Sign In</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Controls */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onBackToKiosk}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'var(--surface-card, #18181B)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                color: 'var(--text-primary)',
                borderRadius: 9999,
                fontSize: '0.88rem',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Customer Kiosk</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. When a Barber IS selected: Show Touch PIN Keypad */
        <div className="slide-up" style={{ maxWidth: 360, margin: '0 auto', textAlign: 'center' }}>
          {/* Selected Barber Header Badge */}
          <div
            style={{
              background: 'var(--surface-card, #18181B)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
              borderRadius: 24,
              padding: '20px 18px',
              boxShadow: 'var(--shadow-md)',
              marginBottom: 16
            }}
          >
            {/* Top Switch Barber action */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <button
                onClick={() => {
                  setSelectedBarber(null);
                  setPin('');
                  setError(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  color: 'var(--text-secondary)',
                  borderRadius: 9999,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={12} />
                <span>Switch Barber</span>
              </button>
            </div>

            {/* Barber Avatar & Info */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: selectedBarber.avatarColor || 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.45rem',
                fontWeight: 900,
                margin: '0 auto 10px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              {selectedBarber.name.charAt(0)}
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 2px' }}>
              {selectedBarber.name}
            </h3>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Enter 4-Digit Passcode
            </div>

            {/* 4-Digit PIN Indicators */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 14,
                marginBottom: error ? 10 : 16,
                transform: isShaking ? 'translateX(4px)' : 'none',
                transition: 'transform 0.1s'
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: i < pin.length ? 'var(--accent-primary, #F59E0B)' : 'var(--surface-pill, #27272A)',
                    border: error ? '2px solid #EF4444' : '1px solid var(--border-subtle, rgba(255,255,255,0.2))',
                    transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: i < pin.length ? '0 0 8px var(--accent-primary, #F59E0B)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="slide-down"
                style={{
                  color: '#EF4444',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  marginBottom: 12
                }}
              >
                <AlertCircle size={13} />
                <span>Incorrect passcode. Try again.</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  style={{
                    height: 50,
                    fontSize: '1.35rem',
                    fontWeight: 750,
                    borderRadius: 16,
                    background: 'var(--surface-pill, #27272A)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleDigit(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                style={{
                  height: 50,
                  borderRadius: 16,
                  background: 'var(--surface-pill, #27272A)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  cursor: 'pointer'
                }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                style={{
                  height: 50,
                  fontSize: '1.35rem',
                  fontWeight: 750,
                  borderRadius: 16,
                  background: 'var(--surface-pill, #27272A)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  cursor: 'pointer'
                }}
                onClick={() => handleDigit('0')}
              >
                0
              </button>
              <button
                type="button"
                style={{
                  height: 50,
                  borderRadius: 16,
                  background: 'var(--surface-pill, #27272A)',
                  fontSize: '1.2rem',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  cursor: 'pointer'
                }}
                onClick={handleBackspace}
              >
                ⌫
              </button>
            </div>

            {/* Passcode Helper Note */}
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Default PIN: <strong style={{ color: 'var(--accent-primary)' }}>1111</strong>
            </div>
          </div>

          <button
            onClick={onBackToKiosk}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              margin: '0 auto'
            }}
          >
            <ArrowLeft size={14} />
            <span>Cancel & Back</span>
          </button>
        </div>
      )}
    </div>
  );
};
