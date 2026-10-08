import React, { useState } from 'react';
import { X, Check, User, Clock, Keyboard as KeyboardIcon, Flame, AlertCircle, Phone } from 'lucide-react';
import type { Barber } from '../../types';
import { OnScreenKeyboard } from '../Shared/OnScreenKeyboard';
import { IosTimePicker, getCurrentFormattedTime } from '../Shared/IosTimePicker';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface ClientCheckInModalProps {
  selectedBarber: Barber;
  checkInType?: 'appointment' | 'walkin';
  isBarberBusy?: boolean;
  onSubmit: (clientName: string, appointmentTime: string, checkInType: 'appointment' | 'walkin', clientPhone?: string) => void;
  onCancel: () => void;
}

export const ClientCheckInModal: React.FC<ClientCheckInModalProps> = ({
  selectedBarber,
  checkInType = 'appointment',
  isBarberBusy = false,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentTime, setAppointmentTime] = useState<string>(() => 
    checkInType === 'walkin' ? 'Walk-In' : getCurrentFormattedTime()
  );
  const [showKeyboard, setShowKeyboard] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    onSubmit(
      name.trim(), 
      checkInType === 'walkin' ? 'Walk-In' : appointmentTime, 
      checkInType,
      phone.trim() || undefined
    );
  };

  return (
    <ModalOverlay onClose={onCancel} maxWidth={480}>
      <button
        onClick={onCancel}
        style={{ position: 'absolute', top: 20, right: 20, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <X size={22} />
      </button>

        {/* Selected Barber Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: selectedBarber.avatarColor || 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {checkInType === 'walkin' ? (
              <Flame size={28} strokeWidth={2.2} />
            ) : (
              <User size={28} strokeWidth={2.2} />
            )}
          </div>
          <div>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: checkInType === 'walkin' ? '#F59E0B' : 'var(--text-secondary)',
              background: 'var(--surface-pill, #27272A)',
              padding: '3px 10px',
              borderRadius: 9999
            }}>
              {checkInType === 'walkin' ? 'Walk-In Check-In' : 'Appointment Check-In'}
            </span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: 4, margin: 0 }}>
              {selectedBarber.id === 'first_available' ? 'First Available Chair' : `With ${selectedBarber.name}`}
            </h3>
          </div>
        </div>

        {/* Barber Busy Notice Banner */}
        {isBarberBusy && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            color: '#F59E0B',
            fontSize: '0.82rem',
            marginBottom: '16px',
            lineHeight: 1.35
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Note:</strong> {selectedBarber.name} is currently with a client. We'll buzz their phone so they know you are here!
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Client Name Input */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                <User size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Your First Name *
              </label>
              <button
                type="button"
                onClick={() => setShowKeyboard(!showKeyboard)}
                style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
              >
                <KeyboardIcon size={14} />
                <span>{showKeyboard ? 'Hide Keypad' : 'Touch Keypad'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bubbly-input"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--surface-pill, #27272A)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Virtual Touch Keyboard */}
          {showKeyboard && (
            <div style={{ marginBottom: 18 }}>
              <OnScreenKeyboard
                value={name}
                onChange={setName}
                onDone={() => setShowKeyboard(false)}
              />
            </div>
          )}

          {/* Client Phone Number Input (Optional) */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                <Phone size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Phone Number <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Optional)</span>
              </label>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                For SMS when chair is ready
              </span>
            </div>
            <input
              type="tel"
              placeholder="(555) 000-0000"
              value={phone}
              onChange={handlePhoneChange}
              className="bubbly-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--surface-pill, #27272A)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Time Picker (Only needed for appointments) */}
          {checkInType === 'appointment' && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} />
                <span>Scheduled Time:</span>
              </label>

              <IosTimePicker
                value={appointmentTime}
                onChange={setAppointmentTime}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '14px',
                background: 'var(--surface-pill, #27272A)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                color: 'var(--text-secondary)',
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '14px',
                background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
                color: '#000000',
                borderRadius: '16px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Check size={20} />
              <span>Confirm Check-In</span>
            </button>
          </div>
        </form>
    </ModalOverlay>
  );
};
