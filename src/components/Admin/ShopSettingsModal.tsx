import React, { useState } from 'react';
import { Settings, X, Check, Sun, Moon } from 'lucide-react';
import type { ShopConfig } from '../../types';
import { applyTheme, type ThemeId } from '../../utils/themes';
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
  const initialTheme: ThemeId = (
    config.themeId === 'clean_studio' || 
    config.themeId === 'classic_heritage' || 
    config.themeId === 'rose_gold'
  ) ? 'clean_studio' : 'obsidian_noir';

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(initialTheme);
  const [welcomeShoppingBody, setWelcomeShoppingBody] = useState(
    config.welcomeShoppingBody || 'Check in for your appointment or sign in for walk-in rotation.'
  );
  const [autoResetShoppingSec, setAutoResetShoppingSec] = useState<number>(config.autoResetShoppingSec || 6);
  const [autoResetAppointmentSec, setAutoResetAppointmentSec] = useState<number>(config.autoResetAppointmentSec || 6);
  const [pinCode, setPinCode] = useState(config.pinCode || '1234');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectTheme = (theme: 'clean_studio' | 'obsidian_noir') => {
    setSelectedTheme(theme);
    applyTheme(theme);
  };

  const handleCancel = () => {
    // Revert to original theme if cancelled
    applyTheme(initialTheme);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopConfig = {
      ...config,
      themeId: selectedTheme,
      welcomeShoppingBody,
      autoResetShoppingSec: Number(autoResetShoppingSec),
      autoResetAppointmentSec: Number(autoResetAppointmentSec),
      pinCode
    };
    applyTheme(selectedTheme);
    onSaveConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  return (
    <ModalOverlay onClose={handleCancel} maxWidth={480}>
      <div style={{ position: 'relative' }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
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
              Shop & Kiosk Settings
            </h3>
            <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Theme appearance, greetings, auto-reset timers & PIN
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit}>
          {/* Theme Appearance Mode Toggle */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.82rem', 
              fontWeight: 750, 
              marginBottom: 8, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}>
              <span>Display Theme</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                • App & Kiosk appearance
              </span>
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              padding: 4,
              borderRadius: 16,
              background: 'var(--surface-pill, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))'
            }}>
              {/* Dark Mode Button */}
              <button
                type="button"
                onClick={() => handleSelectTheme('obsidian_noir')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: selectedTheme === 'obsidian_noir'
                    ? '2px solid var(--accent-primary, #F59E0B)'
                    : '1px solid transparent',
                  background: selectedTheme === 'obsidian_noir'
                    ? 'var(--surface-card, #141417)'
                    : 'transparent',
                  color: selectedTheme === 'obsidian_noir'
                    ? 'var(--text-primary, #FAFAFA)'
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  transition: 'all 0.18s ease',
                  boxShadow: selectedTheme === 'obsidian_noir'
                    ? '0 4px 14px rgba(0,0,0,0.35)'
                    : 'none'
                }}
              >
                <Moon size={16} style={{ color: selectedTheme === 'obsidian_noir' ? 'var(--accent-primary, #F59E0B)' : 'currentColor' }} />
                <span>Dark Mode</span>
              </button>

              {/* Light Mode Button */}
              <button
                type="button"
                onClick={() => handleSelectTheme('clean_studio')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: selectedTheme === 'clean_studio'
                    ? '2px solid var(--accent-primary, #F59E0B)'
                    : '1px solid transparent',
                  background: selectedTheme === 'clean_studio'
                    ? '#FFFFFF'
                    : 'transparent',
                  color: selectedTheme === 'clean_studio'
                    ? '#09090B'
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  transition: 'all 0.18s ease',
                  boxShadow: selectedTheme === 'clean_studio'
                    ? '0 4px 14px rgba(0,0,0,0.12)'
                    : 'none'
                }}
              >
                <Sun size={16} style={{ color: selectedTheme === 'clean_studio' ? '#F59E0B' : 'currentColor' }} />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Welcome Message */}
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

          {/* Timers & PIN */}
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
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))' }}>
            <button
              type="button"
              onClick={handleCancel}
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
