import React, { useState } from 'react';
import { 
  UserCheck, 
  ShoppingBag, 
  Sparkles, 
  CreditCard, 
  ChevronRight, 
  Image as ImageIcon,
  User,
  Phone
} from 'lucide-react';
import { WalkingLegsIcon } from '../Shared/WalkingLegsIcon';
import { ModalOverlay } from '../Shared/ModalOverlay';
import type { ShopConfig, Barber, CheckInRecord } from '../../types';

interface KioskHomeProps {
  config: ShopConfig;
  shopSlug?: string;
  barbers: Barber[];
  checkIns: CheckInRecord[];
  onSelectBrowsing: () => void;
  onSelectCheckout: () => void;
  onSelectAppointment: () => void;
  onJoinWalkInDirect: (clientName: string, clientPhone?: string) => void;
}

export const KioskHome: React.FC<KioskHomeProps> = ({
  config,
  shopSlug = 'of',
  barbers: _barbers,
  checkIns: _checkIns,
  onSelectBrowsing,
  onSelectCheckout,
  onSelectAppointment,
  onJoinWalkInDirect
}) => {
  const isShoppingShop = config.enableShoppingMode === true;
  const brandLogo = config.logoUrl || (shopSlug === 'of' ? '/logo.png' : undefined);

  // Walk-In Fast Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    onJoinWalkInDirect(walkInName.trim(), walkInPhone.trim() || undefined);
    setWalkInName('');
    setWalkInPhone('');
    setShowWalkInModal(false);
  };

  return (
    <div className="kiosk-home-container pop-in" style={{ width: '100%', maxWidth: '980px', margin: '0 auto', padding: '0 12px' }}>
      {/* Brand Header / Logo Area */}
      <div className="kiosk-logo-wrapper" style={{ textAlign: 'center', marginBottom: '28px' }}>
        {brandLogo ? (
          <img
            src={brandLogo}
            alt={config.shopName}
            className="kiosk-brand-logo"
            style={{ maxHeight: '56px', maxWidth: '280px', width: 'auto', objectFit: 'contain', margin: '0 auto' }}
          />
        ) : (
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 24px',
            background: 'var(--surface-card, #18181B)',
            border: '2px dashed var(--border-subtle, rgba(255,255,255,0.2))',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '5px',
                borderRadius: '8px',
                background: 'var(--accent-primary-light, rgba(255,255,255,0.12))',
                color: 'var(--accent-primary, #FAFAFA)'
              }}>
                <ImageIcon size={16} />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)'
              }}>
                {config.shopName}
              </span>
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--text-primary, #FAFAFA)'
            }}>
              {config.shopName}
            </h1>
          </div>
        )}
      </div>

      {/* ================= EXACTLY TWO BIG HERO CHOICE CARDS ================= */}
      {isShoppingShop ? (
        /* OF Supply Mode (Store Supplies + Scheduled Haircuts) */
        <div className="choice-cards-grid">
          {/* Card 1: Here to Shop */}
          <div className="bubbly-choice-card shopping-card-split">
            <div className="card-icon-bubble">
              <ShoppingBag size={46} strokeWidth={2.2} />
            </div>

            <h2 className="choice-card-title">
              Here to Shop
            </h2>
            
            <p className="choice-card-desc">
              Barber supplies, clippers, tools & grooming essentials
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
              <button
                onClick={onSelectBrowsing}
                className="btn-action-pill"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '0.96rem',
                  fontWeight: 750,
                  background: 'var(--surface-pill, #27272A)',
                  color: 'var(--text-primary, #FAFAFA)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={18} />
                <span>I'm Browsing Supplies</span>
              </button>

              <button
                onClick={onSelectCheckout}
                className="choice-card-action-btn"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <CreditCard size={18} />
                <span>Ready to Checkout</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Card 2: Appointment / Haircuts */}
          <div
            className="bubbly-choice-card"
            onClick={onSelectAppointment}
            role="button"
            tabIndex={0}
          >
            <div className="card-icon-bubble">
              <UserCheck size={46} strokeWidth={2.2} />
            </div>

            <h2 className="choice-card-title">
              I Have an Appointment
            </h2>
            
            <p className="choice-card-desc">
              Check in with your barber for scheduled cuts and master grooming
            </p>

            <div style={{ width: '100%', marginTop: 'auto' }}>
              <button className="choice-card-action-btn" style={{ padding: '16px 20px', fontSize: '1.05rem' }}>
                <UserCheck size={20} />
                <span>Check In with Barber</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Barbershop Mode (Two Big Clean Buttons: Walk-In & Appointment) */
        <div className="choice-cards-grid">
          {/* ================= OPTION 1: I'M WALKING IN (BIG BUTTON) ================= */}
          <div
            className="bubbly-choice-card primary-walkin-card"
            onClick={() => setShowWalkInModal(true)}
            role="button"
            tabIndex={0}
          >
            <div
              className="card-icon-bubble"
              style={{
                background: 'var(--pastel-amber-bg)',
                color: 'var(--pastel-amber)',
                border: '1px solid var(--pastel-amber-border)'
              }}
            >
              <WalkingLegsIcon size={46} strokeWidth={2.4} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 className="choice-card-title" style={{ margin: 0 }}>
                I'm Walking In
              </h2>
            </div>
            
            <p className="choice-card-desc">
              No appointment? Tap here to get placed on the line for the next open chair.
            </p>

            <div style={{ width: '100%', marginTop: 'auto' }}>
              <button
                className="choice-card-action-btn"
                style={{
                  padding: '16px 22px',
                  fontSize: '1.05rem',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <WalkingLegsIcon size={20} strokeWidth={2.2} />
                <span>Join Walk-In Line</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* ================= OPTION 2: I HAVE AN APPOINTMENT (BIG BUTTON) ================= */}
          <div
            className="bubbly-choice-card"
            onClick={onSelectAppointment}
            role="button"
            tabIndex={0}
          >
            <div className="card-icon-bubble">
              <UserCheck size={48} strokeWidth={2.2} />
            </div>

            <h2 className="choice-card-title">
              I Have an Appointment
            </h2>
            
            <p className="choice-card-desc">
              Already booked? Tap to select your barber and notify them you have arrived.
            </p>

            <div style={{ width: '100%', marginTop: 'auto' }}>
              <button
                className="choice-card-action-btn"
                style={{
                  padding: '18px 24px',
                  fontSize: '1.12rem',
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                  color: 'var(--text-primary)'
                }}
              >
                <UserCheck size={22} />
                <span>Check In with Barber</span>
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSTANT 1-FIELD WALK-IN MODAL (100% CENTERED VIA MODALOVERLAY) ================= */}
      {showWalkInModal && (
        <ModalOverlay onClose={() => setShowWalkInModal(false)} maxWidth={440}>
          <button
            onClick={() => setShowWalkInModal(false)}
            className="modal-close-btn"
            style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>

          <div className="modal-header-icon-wrap" style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--accent-primary, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <WalkingLegsIcon size={32} strokeWidth={2.2} />
            </div>
            <h3 className="modal-main-title" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Join Walk-In Line
            </h3>
            <p className="modal-sub-title" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Quick check-in • Ready for next open chair
            </p>
          </div>

          <form onSubmit={handleWalkInSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="modal-input-label" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <User size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                <span>Enter Your First Name *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Jordan"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="futuristic-text-input"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                  borderRadius: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="modal-input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <Phone size={14} />
                  <span>Phone Number <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>(Optional)</span></span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get notified when ready</span>
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={walkInPhone}
                onChange={(e) => setWalkInPhone(formatPhoneNumber(e.target.value))}
                className="futuristic-text-input"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                  borderRadius: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
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
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '1.02rem',
                  fontWeight: 850,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)'
                }}
              >
                <span>Join Line Now</span>
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
};
