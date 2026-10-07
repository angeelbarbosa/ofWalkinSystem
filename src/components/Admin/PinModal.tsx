import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface PinModalProps {
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ correctPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        if (next === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <ModalOverlay onClose={onCancel} maxWidth={380} cardStyle={{ textAlign: 'center' }}>
      <button
        onClick={onCancel}
        style={{ position: 'absolute', top: 20, right: 20, color: '#A1A1AA', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <X size={22} />
      </button>

      <div style={{
        width: 60,
        height: 60,
        borderRadius: 20,
        background: 'var(--surface-pill, #27272A)',
        color: 'var(--text-primary, #FAFAFA)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        <Lock size={28} />
      </div>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #FAFAFA)', marginBottom: '6px' }}>Staff Access PIN</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #A1A1AA)', marginBottom: '20px' }}>
        Enter your 4-digit manager PIN (Default: <strong>{correctPin}</strong>)
      </p>

      {/* PIN Indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: i < pin.length ? 'var(--accent-primary, #F59E0B)' : 'var(--surface-pill, #27272A)',
              transition: 'all 0.2s',
              transform: error ? 'scale(1.2)' : 'none',
              border: error ? '2px solid var(--pastel-red, #EF4444)' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))'
            }}
          />
        ))}
      </div>

      {error && (
        <p style={{ color: 'var(--pastel-red, #EF4444)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 16 }}>
          Incorrect PIN. Please try again.
        </p>
      )}

      {/* Number Pad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button
            key={num}
            type="button"
            className="key-btn"
            style={{ height: 52, fontSize: '1.3rem', borderRadius: 16 }}
            onClick={() => handleDigit(num)}
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          className="key-btn"
          style={{ height: 52, borderRadius: 16, background: 'var(--surface-pill, #27272A)' }}
          onClick={() => setPin('')}
        >
          Clear
        </button>
        <button
          type="button"
          className="key-btn"
          style={{ height: 52, fontSize: '1.3rem', borderRadius: 16 }}
          onClick={() => handleDigit('0')}
        >
          0
        </button>
        <button
          type="button"
          className="key-btn"
          style={{ height: 52, borderRadius: 16, background: 'var(--surface-pill, #27272A)' }}
          onClick={handleBackspace}
        >
          ⌫
        </button>
      </div>
    </ModalOverlay>
  );
};

