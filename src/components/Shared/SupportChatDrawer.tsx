import React, { useState, useEffect, useRef } from 'react';
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
  messages,
  onSendMessage,
  onMarkRead,
  userRole = 'shop_owner'
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for this specific shop
  const shopSlug = currentShop?.slug || 'of';
  const shopMessages = messages.filter(m => m.shopSlug === shopSlug);

  useEffect(() => {
    if (isOpen) {
      onMarkRead();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, shopMessages.length, onMarkRead]);

  if (!isOpen || !currentShop) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    onSendMessage(prompt);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isHqUser = userRole === 'platform_hq';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
      }}
      onClick={onClose}
    >
      <div 
        className="slide-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--surface-card, #141417)',
          borderLeft: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: 'var(--shadow-lg)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 16px)) 18px 16px',
          background: 'var(--surface-pill, #1C1C21)',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'var(--accent-primary)',
              color: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Shield size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                  {isHqUser ? `Chat: ${currentShop.name}` : 'Platform HQ Support'}
                </h3>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--pastel-green, #34D399)',
                  boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)'
                }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isHqUser 
                  ? `Direct message line with ${currentShop.ownerContactName || 'Shop Owner'}` 
                  : 'Direct line to your system administrator'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
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
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          {/* Welcome Banner */}
          <div style={{
            background: 'var(--surface-pill)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '12px 14px',
            textAlign: 'center',
            marginBottom: '4px'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 800 }}>
              <Sparkles size={14} />
              <span>Direct Support Channel</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
              {isHqUser
                ? `Replying as Platform Admin to ${currentShop.name}.`
                : `Need help with your kiosk, booth rent, or settings? Message us below for assistance.`}
            </p>
          </div>

          {shopMessages.length === 0 ? (
            <div style={{
              margin: 'auto 0',
              textAlign: 'center',
              padding: '30px 16px',
              color: 'var(--text-muted)'
            }}>
              <MessageSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                No messages yet
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                Send a message below to start a conversation with {isHqUser ? currentShop.name : 'Platform Support'}.
              </p>
            </div>
          ) : (
            shopMessages.map((msg) => {
              // Is this message from ME (the current logged in user role)?
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
                    marginBottom: '3px',
                    padding: '0 4px'
                  }}>
                    {isMine ? 'You' : msg.senderName || (msg.sender === 'platform_hq' ? 'Platform HQ' : 'Shop Owner')}
                  </div>

                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
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
                    lineHeight: 1.45,
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
                    marginTop: '3px',
                    padding: '0 4px'
                  }}>
                    <Clock size={10} />
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMine && <CheckCheck size={11} style={{ color: 'var(--pastel-green)' }} />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (Only for Shop Owners) */}
        {!isHqUser && (
          <div style={{
            padding: '8px 14px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            background: 'var(--surface-card)',
            borderTop: '1px solid var(--border-subtle)',
            scrollbarWidth: 'none'
          }}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
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
            padding: '12px 16px max(16px, env(safe-area-inset-bottom, 16px)) 16px',
            background: 'var(--surface-pill)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxSizing: 'border-box'
          }}
        >
          <input
            type="text"
            placeholder={isHqUser ? `Reply to ${currentShop.name}...` : 'Type a message to Platform HQ...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
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
              width: '42px',
              height: '42px',
              borderRadius: '14px',
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
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
