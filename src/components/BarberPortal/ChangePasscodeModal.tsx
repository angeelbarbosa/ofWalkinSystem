import React, { useState } from 'react';
import { KeyRound, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import type { Barber } from '../../types';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface ChangePasscodeModalProps {
  barber: Barber;
  onSaveNewPasscode: (newPasscode: string) => void;
  onClose: () => void;
}

export const ChangePasscodeModal: React.FC<ChangePasscodeModalProps> = ({
  barber,
  onSaveNewPasscode,
  onClose
}) => {
  const currentSavedPasscode = barber.passcode || '1111';

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Active field being typed on touch keypad: 'current' | 'new' | 'confirm'
  const [activeField, setActiveField] = useState<'current' | 'new' | 'confirm'>('current');

  const handleKeypadDigit = (digit: string) => {
    setErrorMessage(null);
    if (activeField === 'current') {
      if (currentPin.length < 4) {
        const val = currentPin + digit;
        setCurrentPin(val);
        if (val.length === 4) {
          setActiveField('new');
        }
      }
    } else if (activeField === 'new') {
      if (newPin.length < 4) {
        const val = newPin + digit;
        setNewPin(val);
        if (val.length === 4) {
          setActiveField('confirm');
        }
      }
    } else if (activeField === 'confirm') {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + digit);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (activeField === 'confirm') {
      if (confirmPin.length > 0) {
        setConfirmPin(prev => prev.slice(0, -1));
      } else {
        setActiveField('new');
      }
    } else if (activeField === 'new') {
      if (newPin.length > 0) {
        setNewPin(prev => prev.slice(0, -1));
      } else {
        setActiveField('current');
      }
    } else if (activeField === 'current') {
      setCurrentPin(prev => prev.slice(0, -1));
    }
  };

  const handleClearAll = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setActiveField('current');
    setErrorMessage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // 1. Verify current passcode
    if (currentPin !== currentSavedPasscode) {
      setErrorMessage('Current passcode is incorrect.');
      setActiveField('current');
      return;
    }

    // 2. Validate new passcode
    if (newPin.length < 4) {
      setErrorMessage('New passcode must be exactly 4 digits.');
      setActiveField('new');
      return;
    }

    // 3. Validate match
    if (newPin !== confirmPin) {
      setErrorMessage('New passcode and confirmation do not match.');
      setActiveField('confirm');
      return;
    }

    // Success
    onSaveNewPasscode(newPin);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={440} cardStyle={{ textAlign: 'center' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: '#F4F4F5',
            border: 'none',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717A',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            background: '#09090B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px'
          }}
        >
          {isSuccess ? <ShieldCheck size={28} /> : <KeyRound size={26} />}
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 850, color: '#09090B', marginBottom: 4 }}>
          {isSuccess ? 'Passcode Updated!' : 'Change Station Passcode'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#71717A', marginBottom: 20 }}>
          {isSuccess
            ? `Your station PIN for ${barber.name} has been securely updated.`
            : `Set a private 4-digit PIN for ${barber.name} (Station #${barber.stationNumber})`}
        </p>

        {isSuccess ? (
          <div className="pop-in" style={{ padding: '20px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#F0FDF4',
                color: '#15803D',
                padding: '10px 20px',
                borderRadius: 9999,
                fontWeight: 800,
                fontSize: '0.95rem'
              }}
            >
              <Check size={18} />
              <span>Saved Successfully</span>
            </div>
          </div>
        ) : (
          <div>
            {/* Input Fields Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {/* Field 1: Current PIN */}
              <div
                onClick={() => setActiveField('current')}
                style={{
                  background: activeField === 'current' ? '#FFFFFF' : '#FAFAFA',
                  border: activeField === 'current' ? '2px solid #09090B' : '1px solid #E4E4E7',
                  borderRadius: 16,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: activeField === 'current' ? '#09090B' : '#71717A', textTransform: 'uppercase' }}>
                    1. Current Passcode
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#A1A1AA' }}>
                    Default is 1111
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        background: i < currentPin.length ? '#09090B' : '#E4E4E7',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Field 2: New PIN */}
              <div
                onClick={() => setActiveField('new')}
                style={{
                  background: activeField === 'new' ? '#FFFFFF' : '#FAFAFA',
                  border: activeField === 'new' ? '2px solid #09090B' : '1px solid #E4E4E7',
                  borderRadius: 16,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: activeField === 'new' ? '#09090B' : '#71717A', textTransform: 'uppercase' }}>
                    2. New Passcode
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#A1A1AA' }}>
                    4 digits of your choice
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        background: i < newPin.length ? '#09090B' : '#E4E4E7',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Field 3: Confirm PIN */}
              <div
                onClick={() => setActiveField('confirm')}
                style={{
                  background: activeField === 'confirm' ? '#FFFFFF' : '#FAFAFA',
                  border: activeField === 'confirm' ? '2px solid #09090B' : '1px solid #E4E4E7',
                  borderRadius: 16,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: activeField === 'confirm' ? '#09090B' : '#71717A', textTransform: 'uppercase' }}>
                    3. Confirm New Passcode
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#A1A1AA' }}>
                    Re-enter new 4 digits
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        background: i < confirmPin.length ? '#09090B' : '#E4E4E7',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                className="slide-down"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  color: '#991B1B',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: 16
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="key-btn"
                  style={{ height: 48, fontSize: '1.25rem', borderRadius: 14 }}
                  onClick={() => handleKeypadDigit(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="key-btn"
                style={{ height: 48, borderRadius: 14, background: '#F4F4F5', fontSize: '0.82rem', fontWeight: 700, color: '#71717A' }}
                onClick={handleClearAll}
              >
                Clear
              </button>
              <button
                type="button"
                className="key-btn"
                style={{ height: 48, fontSize: '1.25rem', borderRadius: 14 }}
                onClick={() => handleKeypadDigit('0')}
              >
                0
              </button>
              <button
                type="button"
                className="key-btn"
                style={{ height: 48, borderRadius: 14, background: '#F4F4F5', fontSize: '1.1rem' }}
                onClick={handleBackspace}
              >
                ⌫
              </button>
            </div>

            {/* Submit Action */}
            <button
              onClick={() => handleSubmit()}
              disabled={currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
              className="choice-card-action-btn"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '0.92rem',
                opacity: (currentPin.length === 4 && newPin.length === 4 && confirmPin.length === 4) ? 1 : 0.45,
                cursor: (currentPin.length === 4 && newPin.length === 4 && confirmPin.length === 4) ? 'pointer' : 'not-allowed'
              }}
            >
              <Check size={18} />
              <span>Update Passcode</span>
            </button>
          </div>
        )}
    </ModalOverlay>
  );
};
