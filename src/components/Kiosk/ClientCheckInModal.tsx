import React, { useState } from 'react';
import { X, Check, User, Clock, Keyboard as KeyboardIcon } from 'lucide-react';
import type { Barber } from '../../types';
import { OnScreenKeyboard } from '../Shared/OnScreenKeyboard';
import { IosTimePicker, getCurrentFormattedTime } from '../Shared/IosTimePicker';

interface ClientCheckInModalProps {
  selectedBarber: Barber;
  onSubmit: (clientName: string, appointmentTime: string) => void;
  onCancel: () => void;
}

export const ClientCheckInModal: React.FC<ClientCheckInModalProps> = ({
  selectedBarber,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [appointmentTime, setAppointmentTime] = useState<string>(() => getCurrentFormattedTime());
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    onSubmit(name.trim(), appointmentTime);
  };

  return (
    <div className="modal-overlay">
      <div className="bubbly-modal-card pop-in" style={{ maxWidth: '520px', padding: '34px 28px' }}>
        <button
          onClick={onCancel}
          style={{ position: 'absolute', top: 22, right: 22, color: '#A1A1AA' }}
        >
          <X size={24} />
        </button>

        {/* Selected Barber Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              background: '#09090B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <User size={30} strokeWidth={2.2} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#52525B', background: '#F4F4F5', padding: '4px 12px', borderRadius: 9999 }}>
              Appointment Check-In
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 850, color: '#09090B', marginTop: 4 }}>
              With {selectedBarber.name}
            </h3>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Client Name Input */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ fontSize: '0.95rem', margin: 0 }}>
                <User size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Your Name
              </label>
              <button
                type="button"
                onClick={() => setShowKeyboard(!showKeyboard)}
                style={{ fontSize: '0.82rem', color: '#09090B', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
              >
                <KeyboardIcon size={15} />
                <span>{showKeyboard ? 'Hide Keypad' : 'Touch Keypad'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Enter your first name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bubbly-input"
              autoFocus
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

          {/* iOS Apple Scroll Wheel Time Picker */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ fontSize: '0.95rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} />
              <span>Appointment Time:</span>
            </label>

            <IosTimePicker
              value={appointmentTime}
              onChange={setAppointmentTime}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              className="back-pill-btn"
              style={{ flex: 1, justifyContent: 'center', padding: '16px 20px', fontSize: '1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="choice-card-action-btn"
              style={{ flex: 2, padding: '16px 20px', fontSize: '1.1rem' }}
            >
              <Check size={22} />
              <span>Check In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
