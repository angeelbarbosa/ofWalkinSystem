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
    <div className="pop-in" style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {/* 1. If NO barber is selected yet: Show Barber Station Roster */}
      {!selectedBarber ? (
        <div>
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                background: '#09090B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}
            >
              <Scissors size={28} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#09090B', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Barber Hub Access
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#71717A', maxWidth: 460, margin: '0 auto' }}>
              Select your station profile to access your private client queue, call-ins, and booth rent ledger.
            </p>
          </div>

          {/* Barbers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 32
            }}
          >
            {activeBarbers.map((barber) => (
              <div
                key={barber.id}
                onClick={() => handleSelectBarber(barber)}
                className="bubbly-choice-card slide-up"
                style={{
                  padding: '24px 20px',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: 22,
                  border: '1px solid #E4E4E7',
                  background: '#FFFFFF',
                  position: 'relative'
                }}
              >
                {/* Station Tag & Lock Indicator */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      background: '#F4F4F5',
                      color: '#09090B',
                      padding: '4px 10px',
                      borderRadius: 9999
                    }}
                  >
                    Station #{barber.stationNumber}
                  </span>

                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: '#F4F4F5',
                      color: '#71717A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Passcode Protected"
                  >
                    <Lock size={13} />
                  </div>
                </div>

                {/* Avatar & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      background: '#09090B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 850,
                      flexShrink: 0
                    }}
                  >
                    {barber.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: '#09090B', lineHeight: 1.2 }}>
                      {barber.name}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', marginTop: 2 }}>
                      {barber.specialty || 'Master Cuts'}
                    </div>
                  </div>
                </div>

                {/* Tap to Unlock Indicator */}
                <div
                  style={{
                    width: '100%',
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: '1px solid #F4F4F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#09090B'
                  }}
                >
                  <span>Open Station</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Controls */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onBackToKiosk}
              className="back-pill-btn"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Customer Kiosk</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. When a Barber IS selected: Show Touch PIN Keypad */
        <div className="slide-up" style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          {/* Selected Barber Header Badge */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E4E4E7',
              borderRadius: 24,
              padding: '24px 20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
              marginBottom: 20
            }}
          >
            {/* Top Switch Barber action */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <button
                onClick={() => {
                  setSelectedBarber(null);
                  setPin('');
                  setError(false);
                }}
                className="back-pill-btn"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <ArrowLeft size={13} />
                <span>Switch Barber</span>
              </button>
            </div>

            {/* Barber Avatar & Info */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: '#09090B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 850,
                margin: '0 auto 12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              {selectedBarber.name.charAt(0)}
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 850, color: '#09090B', marginBottom: 2 }}>
              {selectedBarber.name}
            </h3>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#71717A', marginBottom: 18 }}>
              Station #{selectedBarber.stationNumber} • Enter 4-Digit Passcode
            </div>

            {/* 4-Digit PIN Indicators */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                marginBottom: error ? 12 : 20,
                transform: isShaking ? 'translateX(4px)' : 'none',
                transition: 'transform 0.1s'
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: i < pin.length ? '#09090B' : '#E4E4E7',
                    border: error ? '2px solid #DC2626' : 'none',
                    transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
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
                  color: '#DC2626',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: 16
                }}
              >
                <AlertCircle size={14} />
                <span>Incorrect passcode. Please try again.</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="key-btn"
                  style={{
                    height: 54,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    borderRadius: 18,
                    background: '#F4F4F5',
                    color: '#09090B',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDigit(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="key-btn"
                style={{
                  height: 54,
                  borderRadius: 18,
                  background: '#F4F4F5',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#71717A',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="key-btn"
                style={{
                  height: 54,
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  borderRadius: 18,
                  background: '#F4F4F5',
                  color: '#09090B',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => handleDigit('0')}
              >
                0
              </button>
              <button
                type="button"
                className="key-btn"
                style={{
                  height: 54,
                  borderRadius: 18,
                  background: '#F4F4F5',
                  fontSize: '1.25rem',
                  color: '#09090B',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={handleBackspace}
              >
                ⌫
              </button>
            </div>

            {/* Helpful Passcode Note */}
            <div style={{ fontSize: '0.78rem', color: '#A1A1AA', marginTop: 12 }}>
              Default passcode: <strong>1111</strong> (Can be changed inside station settings)
            </div>
          </div>

          <button
            onClick={onBackToKiosk}
            className="back-pill-btn"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={15} />
            <span>Cancel & Back to Kiosk</span>
          </button>
        </div>
      )}
    </div>
  );
};
