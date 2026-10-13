import React, { useState, useRef } from 'react';
import { Settings, X, Check, Sun, Moon, Upload, Image as ImageIcon, Trash2, Link as LinkIcon } from 'lucide-react';
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
  const [logoUrl, setLogoUrl] = useState<string>(config.logoUrl || '');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlDraft, setUrlDraft] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [welcomeShoppingBody, setWelcomeShoppingBody] = useState(
    config.welcomeShoppingBody || 'Check in for your appointment or sign in for walk-in rotation.'
  );
  const [autoResetShoppingSec, setAutoResetShoppingSec] = useState<number>(config.autoResetShoppingSec || 6);
  const [autoResetAppointmentSec, setAutoResetAppointmentSec] = useState<number>(
    (config.autoResetAppointmentSec && config.autoResetAppointmentSec !== 6) ? config.autoResetAppointmentSec : 10
  );
  const [pinCode, setPinCode] = useState(config.pinCode || '1234');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTheme = (theme: 'clean_studio' | 'obsidian_noir') => {
    setSelectedTheme(theme);
    applyTheme(theme);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image (PNG, JPG, WebP, SVG)');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const rawSrc = loadEvt.target?.result as string;
      if (!rawSrc) return;

      const img = new Image();
      img.onload = () => {
        try {
          // Keep base64 lightweight (<80KB) for localStorage by resizing if needed
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const isPng = file.type.includes('png') || file.type.includes('svg');
            const compressed = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);
            setLogoUrl(compressed);
          } else {
            setLogoUrl(rawSrc);
          }
        } catch {
          setLogoUrl(rawSrc);
        }
      };
      img.onerror = () => {
        setLogoUrl(rawSrc);
      };
      img.src = rawSrc;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlDraft.trim()) return;
    setLogoUrl(urlDraft.trim());
    setUrlDraft('');
    setShowUrlInput(false);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setUploadError('');
  };

  const handleCancel = () => {
    // Revert to original theme if cancelled
    applyTheme(initialTheme);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLogo = logoUrl.trim();
    const updated: ShopConfig = {
      ...config,
      logoUrl: cleanLogo,
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
    <ModalOverlay onClose={handleCancel} maxWidth={500}>
      <div style={{ position: 'relative', maxHeight: '86vh', overflowY: 'auto', paddingRight: 2 }}>
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
              Kiosk Settings
            </h3>
            <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Brand logo, theme appearance, kiosk greetings & PIN
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit}>
          {/* Shop Logo & Home Screen App Icon */}
          <div style={{
            marginBottom: 18,
            padding: '14px',
            borderRadius: 16,
            background: 'var(--surface-pill, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.82rem', 
                fontWeight: 750, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                margin: 0
              }}>
                <ImageIcon size={15} style={{ color: 'var(--accent-primary, #F59E0B)' }} />
                <span>Shop Brand Logo</span>
              </label>
              <span style={{ fontSize: '0.70rem', color: 'var(--accent-primary, #F59E0B)', fontWeight: 700, background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 9999 }}>
                Kiosk & App Icon
              </span>
            </div>

            {/* Preview & Upload Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* iOS / Android Home Screen App Icon Mockup */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: 15,
                  background: '#121214',
                  border: '1.5px solid rgba(255,255,255,0.16)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Home Screen App Icon"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: 6,
                        boxSizing: 'border-box'
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-primary, #F59E0B)' }}>
                        {config.shopName ? config.shopName.substring(0, 2).toUpperCase() : 'OF'}
                      </span>
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 750,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                  maxWidth: 64,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center'
                }}>
                  {config.shopName || 'App'}
                </span>
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary, #F59E0B)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Home Icon
                </span>
              </div>

              {/* Action Controls & Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  margin: '0 0 10px',
                  lineHeight: 1.35
                }}>
                  Upload your shop logo. It appears on the customer kiosk and becomes the app icon on mobile devices when added to the home screen.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 10,
                      background: 'var(--accent-primary, #F59E0B)',
                      color: '#09090B',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Upload size={13} strokeWidth={2.5} />
                    <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  </button>

                  {/* Remove Button if logo active */}
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '7px 10px',
                        borderRadius: 10,
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--status-error, #EF4444)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '0.76rem',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                      title="Remove custom logo"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  )}

                  {/* Toggle URL Input */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '7px 10px',
                      borderRadius: 10,
                      background: 'var(--surface-pill, rgba(255,255,255,0.06))',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <LinkIcon size={12} />
                    <span>{showUrlInput ? 'Hide URL' : 'Link URL'}</span>
                  </button>
                </div>

                {uploadError && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--status-error, #EF4444)', margin: '6px 0 0', fontWeight: 600 }}>
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Expandable Image URL Input */}
            {showUrlInput && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <input
                  type="url"
                  placeholder="Paste image URL (e.g. https://...)"
                  value={urlDraft}
                  onChange={e => setUrlDraft(e.target.value)}
                  className="bubbly-input"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 10,
                    background: 'var(--surface-card, #27272A)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.76rem',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>
            )}

            {/* Active Kiosk Header Preview */}
            {logoUrl && (
              <div style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Kiosk Header Preview:
                </span>
                <div style={{ height: 26, display: 'flex', alignItems: 'center' }}>
                  <img src={logoUrl} alt="Kiosk Header" style={{ maxHeight: 24, maxWidth: 140, objectFit: 'contain' }} />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--pastel-green, #10B981)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={11} strokeWidth={3} /> Ready
                </span>
              </div>
            )}
          </div>

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
