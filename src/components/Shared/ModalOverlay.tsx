import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalOverlayProps {
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: number | string;
  zIndex?: number;
  className?: string;
  cardStyle?: React.CSSProperties;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  children,
  onClose,
  maxWidth = 460,
  zIndex = 999999,
  className = '',
  cardStyle = {}
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouch;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-overlay pop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(20px, env(safe-area-inset-top, 20px)) 16px max(20px, env(safe-area-inset-bottom, 20px)) 16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overscrollBehavior: 'contain'
      }}
    >
      <div
        className={`bubbly-modal-card pop-in ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
          borderRadius: '28px',
          padding: '26px 22px',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.95)',
          color: 'var(--text-primary, #FAFAFA)',
          margin: 'auto',
          maxHeight: 'calc(100dvh - 48px)',
          overflowY: 'auto',
          position: 'relative',
          boxSizing: 'border-box',
          ...cardStyle
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

