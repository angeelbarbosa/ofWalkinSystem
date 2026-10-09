import React, { useState } from 'react';
import { Settings, X, Check } from 'lucide-react';
import type { ShopConfig } from '../../types';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface ShopSettingsModalProps {
  config: ShopConfig;
  onSaveConfig: (updated: ShopConfig) => void;
  onClose: () => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose
}) => {
  const [welcomeShoppingBody, setWelcomeShoppingBody] = useState(
    config.welcomeShoppingBody || 'Check in for your appointment or sign in for walk-in rotation.'
  );
  const [autoResetShoppingSec, setAutoResetShoppingSec] = useState<number>(config.autoResetShoppingSec || 6);
  const [autoResetAppointmentSec, setAutoResetAppointmentSec] = useState<number>(config.autoResetAppointmentSec || 6);
  const [pinCode, setPinCode] = useState(config.pinCode || '1234');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopConfig = {
      ...config,
      welcomeShoppingBody,
      autoResetShoppingSec: Number(autoResetShoppingSec),
      autoResetAppointmentSec: Number(autoResetAppointmentSec),
      pinCode
    };
    onSaveConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={480}>
      <div style={{ position: 'relative' }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: 'var(--surface-pill, rgba(255,255,255,0.08))',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary, #A1A1AA)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingRight: 32 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--accent-primary, #F59E0B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Settings size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Kiosk Settings
            </h3>
            <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Tailor greetings, auto-reset timers, and security PIN
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>
              {config.enableShoppingMode ? 'Shopping Welcome Message' : 'Kiosk Welcome Greeting'}
            </label>
            <textarea
              rows={3}
              value={welcomeShoppingBody}
              onChange={e => setWelcomeShoppingBody(e.target.value)}
              className="bubbly-input"
              style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
            {config.enableShoppingMode && (
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.80rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  Shopping Reset (s)
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={autoResetShoppingSec}
                  onChange={e => setAutoResetShoppingSec(Number(e.target.value))}
                  className="bubbly-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.80rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                Check-in Reset (s)
              </label>
              <input
                type="number"
                min={2}
                max={60}
                value={autoResetAppointmentSec}
                onChange={e => setAutoResetAppointmentSec(Number(e.target.value))}
                className="bubbly-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.80rem', fontWeight: 700, marginBottom: 6, display: 'block' }}>
                Manager PIN
              </label>
              <input
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                className="bubbly-input"
                style={{ width: '100%', boxSizing: 'border-box', letterSpacing: '2px', fontWeight: 800 }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-pill, rgba(255,255,255,0.06))',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="choice-card-action-btn"
              style={{
                width: 'auto',
                minWidth: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '10px 20px',
                background: savedSuccess ? 'var(--pastel-green, #10B981)' : undefined
              }}
            >
              <Check size={16} />
              <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};
