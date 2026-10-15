import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Check, X, Palette } from 'lucide-react';
import type { Barber } from '../../types';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface ChangeBarberPhotoModalProps {
  barber: Barber;
  onSavePhoto: (avatar: string, avatarColor: string) => void;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Purple', hex: '#8B5CF6' },
  { label: 'Pink', hex: '#EC4899' },
  { label: 'Red', hex: '#EF4444' },
  { label: 'Cyan', hex: '#06B6D4' },
  { label: 'Slate', hex: '#27272A' }
];

export const ChangeBarberPhotoModal: React.FC<ChangeBarberPhotoModalProps> = ({
  barber,
  onSavePhoto,
  onClose
}) => {
  const [avatarDraft, setAvatarDraft] = useState<string>(barber.avatar || '');
  const [colorDraft, setColorDraft] = useState<string>(barber.avatarColor || '#F59E0B');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const rawSrc = loadEvt.target?.result as string;
      if (!rawSrc) {
        setIsProcessing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Crop to a square and resize to max 400x400 for high resolution yet lightweight cloud sync
          const targetSize = 400;
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setAvatarDraft(compressed);
          } else {
            setAvatarDraft(rawSrc);
          }
        } catch (err) {
          console.error('Error resizing avatar:', err);
          setAvatarDraft(rawSrc);
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMessage('Failed to load image. Please try another file.');
        setIsProcessing(false);
      };

      img.src = rawSrc;
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file from your device.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSavePhoto(avatarDraft, colorDraft);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleRemovePhoto = () => {
    setAvatarDraft('');
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={440}>
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          background: 'var(--surface-pill, #27272A)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted, #71717A)',
          cursor: 'pointer'
        }}
        aria-label="Close"
      >
        <X size={17} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--accent-primary, #F59E0B)',
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Camera size={22} />
        </div>
        <div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Barber Profile
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', margin: '2px 0 0', lineHeight: 1.2 }}>
            Change Profile Picture
          </h3>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Live Avatar Preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background: 'var(--surface-pill, #1C1C21)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          borderRadius: 20,
          marginBottom: 20,
          position: 'relative'
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            background: colorDraft,
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 900,
            overflow: 'hidden',
            boxShadow: `0 8px 28px ${colorDraft}40`,
            border: '2px solid rgba(255,255,255,0.15)',
            marginBottom: 12,
            position: 'relative'
          }}
        >
          {avatarDraft ? (
            <img
              src={avatarDraft}
              alt={barber.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            barber.name.charAt(0)
          )}

          {isProcessing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              Loading...
            </div>
          )}
        </div>

        <div style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-primary)' }}>
          {barber.name}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
          Station #{barber.stationNumber} • Appears on Kiosk & Hub
        </div>

        {/* Upload & Remove Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 12,
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Upload size={14} />
            <span>{avatarDraft ? 'Change Photo' : 'Upload Photo'}</span>
          </button>

          {avatarDraft && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--pastel-red, #EF4444)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.80rem',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Accent Color Palette (used when photo is not present or as backdrop) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Palette size={14} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            Avatar Accent Color
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
          {COLOR_SWATCHES.map(swatch => {
            const isSelected = colorDraft.toLowerCase() === swatch.hex.toLowerCase();
            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setColorDraft(swatch.hex)}
                title={swatch.label}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 10,
                  background: swatch.hex,
                  border: isSelected ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                  boxShadow: isSelected ? `0 0 10px ${swatch.hex}` : 'none'
                }}
              >
                {isSelected && <Check size={14} color="#000000" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--status-error, #EF4444)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: 14
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 14,
            background: 'transparent',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 750,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          style={{
            flex: 1.5,
            padding: '12px',
            borderRadius: 14,
            background: savedSuccess ? '#10B981' : 'var(--accent-primary, #F59E0B)',
            color: '#000000',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 900,
            cursor: isProcessing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            transition: 'background 0.2s ease'
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          <span>{savedSuccess ? 'Saved!' : 'Save Photo'}</span>
        </button>
      </div>
    </ModalOverlay>
  );
};
