import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, 
  X, 
  MessageSquare, 
  Shield, 
  CheckCheck, 
  Sparkles,
  Clock
} from 'lucide-react';
import type { SupportMessage, Shop } from '../../types';

interface SupportChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentShop: Shop | null;
  messages: SupportMessage[];
  onSendMessage: (text: string) => void;
  onMarkRead: () => void;
  userRole?: 'shop_owner' | 'barber' | 'platform_hq';
}

const QUICK_PROMPTS = [
  'How do I change booth rent due day?',
  'Need help setting up Kiosk on iPad',
  'How do I add a new barber chair?',
  'Question about my monthly subscription'
];

export const SupportChatDrawer: React.FC<SupportChatDrawerProps> = ({
  isOpen,
  onClose,
  currentShop,
  messages = [],
  onSendMessage,
  onMarkRead,
  userRole = 'shop_owner'
}) => {
  const [inputText, setInputText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const onMarkReadRef = useRef(onMarkRead);
  onMarkReadRef.current = onMarkRead;

  // Filter messages for this specific shop (case-insensitive & trimmed)
  const shopSlug = (currentShop?.slug || 'of').toLowerCase().trim();
  const shopMessages = (messages || []).filter(
    m => (m.shopSlug || '').toLowerCase().trim() === shopSlug
  );

  const isHqUser = userRole === 'platform_hq';
  const hasUnread = shopMessages.some(m => isHqUser ? !m.readByHq : !m.readByShop);

  // Lock background window scroll when drawer is open (bulletproof iOS Safari scroll lock)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const originalTouch = document.body.style.touchAction;
      const scrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.touchAction = originalTouch;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Mark unread messages as read ONLY when open and unread messages actually exist
  useEffect(() => {
    if (isOpen && hasUnread) {
      onMarkReadRef.current?.();
    }
  }, [isOpen, hasUnread]);

  // Direct internal container scroll (NEVER scrolls background window or page)
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [isOpen, shopMessages.length]);

  if (!isOpen || !currentShop) return null;
  if (typeof document === 'undefined') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    onSendMessage(clean);
    setInputText('');
    // Ensure container stays at bottom after local submit
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 20);
  };

  const handleQuickPrompt = (prompt: string) => {
    onSendMessage(prompt);
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 20);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        overflow: 'hidden',
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
      onClick={onClose}
    >
      <div 
        className="slide-up"
        style={{
          width: '100%',
          maxWidth: '430px',
          height: '100%',
          maxHeight: '100dvh',
          background: 'var(--surface-card, #141417)',
          borderLeft: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          touchAction: 'auto',
          overscrollBehavior: 'contain'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: 'max(16px, calc(env(safe-area-inset-top, 0px) + 12px)) 16px 14px',
          background: 'var(--surface-pill, #1C1C21)',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--accent-primary)',
              color: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Shield size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                  {isHqUser ? `Chat: ${currentShop.name}` : 'Platform HQ Support'}
                </h3>
                <span style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--pastel-green, #34D399)',
                  boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)'
                }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isHqUser 
                  ? `Direct message line with ${currentShop.ownerContactName || 'Shop Owner'}` 
                  : 'Direct line to system administrator'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Body (Self-contained scrollable container) */}
        <div 
          ref={messagesContainerRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxSizing: 'border-box',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Welcome Banner */}
          <div style={{
            background: 'var(--surface-pill)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '10px 12px',
            textAlign: 'center',
            marginBottom: '2px',
            flexShrink: 0
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 800 }}>
              <Sparkles size={13} />
              <span>Direct Support Channel</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
              {isHqUser
                ? `Replying as Platform Admin to ${currentShop.name}.`
                : `Need help with your kiosk, booth rent, or settings? Message us below.`}
            </p>
          </div>

          {shopMessages.length === 0 ? (
            <div style={{
              margin: 'auto 0',
              textAlign: 'center',
              padding: '24px 14px',
              color: 'var(--text-muted)'
            }}>
              <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                No messages yet
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Send a message below to start a conversation with {isHqUser ? currentShop.name : 'Platform Support'}.
              </p>
            </div>
          ) : (
            shopMessages.map((msg) => {
              const isMine = isHqUser 
                ? msg.sender === 'platform_hq' 
                : msg.sender === 'shop_owner';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isMine ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 750,
                    color: 'var(--text-muted)',
                    marginBottom: '2px',
                    padding: '0 4px'
                  }}>
                    {isMine ? 'You' : msg.senderName || (msg.sender === 'platform_hq' ? 'Platform HQ' : 'Shop Owner')}
                  </div>

                  <div style={{
                    padding: '9px 13px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMine 
                      ? 'var(--accent-primary)' 
                      : 'var(--surface-pill)',
                    color: isMine 
                      ? 'var(--bg-main)' 
                      : 'var(--text-primary)',
                    border: isMine 
                      ? 'none' 
                      : '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    fontWeight: 500,
                    wordBreak: 'break-word',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {msg.text}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9px',
                    color: 'var(--text-light)',
                    marginTop: '2px',
                    padding: '0 4px'
                  }}>
                    <Clock size={9} />
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMine && <CheckCheck size={11} style={{ color: 'var(--pastel-green)' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Suggestion Chips (Only for Shop Owners) */}
        {!isHqUser && (
          <div style={{
            padding: '7px 12px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            background: 'var(--surface-card)',
            borderTop: '1px solid var(--border-subtle)',
            scrollbarWidth: 'none',
            flexShrink: 0
          }}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '10.5px',
                  fontWeight: 650,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={handleSend}
          style={{
            padding: '10px 14px max(14px, env(safe-area-inset-bottom, 14px)) 14px',
            background: 'var(--surface-pill)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxSizing: 'border-box',
            flexShrink: 0
          }}
        >
          <input
            type="text"
            placeholder={isHqUser ? `Reply to ${currentShop.name}...` : 'Type a message to Platform HQ...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: inputText.trim() ? 'var(--accent-primary)' : 'var(--surface-card)',
              color: inputText.trim() ? 'var(--bg-main)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
