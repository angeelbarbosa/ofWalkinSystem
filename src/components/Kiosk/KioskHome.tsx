import React, { useState } from 'react';
import { 
  Flame, 
  UserCheck, 
  ShoppingBag, 
  Sparkles, 
  CreditCard, 
  ChevronRight, 
  Image as ImageIcon,
  Zap, 
  User
} from 'lucide-react';
import type { ShopConfig, Barber, CheckInRecord } from '../../types';

interface KioskHomeProps {
  config: ShopConfig;
  shopSlug?: string;
  barbers: Barber[];
  checkIns: CheckInRecord[];
  onSelectBrowsing: () => void;
  onSelectCheckout: () => void;
  onSelectAppointment: () => void;
  onJoinWalkInDirect: (clientName: string) => void;
}

export const KioskHome: React.FC<KioskHomeProps> = ({
  config,
  shopSlug = 'of',
  barbers,
  checkIns,
  onSelectBrowsing,
  onSelectCheckout,
  onSelectAppointment,
  onJoinWalkInDirect
}) => {
  const isOfSupply = shopSlug === 'of' || config.shopName.toLowerCase().includes('of supply');

  // Walk-In Fast Modal State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');

  const activeBarbers = barbers.filter(b => b.isWorking);

  // In Chair Clients
  const inChairClients = checkIns.filter(c => c.status === 'in_chair');

  // Waiting in queue (Sorted by arrival time)
  const waitingQueue = checkIns
    .filter(c => c.status === 'waiting' || c.status === 'called')
    .sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());

  // Dynamic estimated wait time
  const estimatedWait = activeBarbers.length > 0 
    ? Math.max(5, Math.round((waitingQueue.length * 15) / Math.max(1, activeBarbers.length)))
    : 10;

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    onJoinWalkInDirect(walkInName.trim());
    setWalkInName('');
    setShowWalkInModal(false);
  };

  return (
    <div className="kiosk-home-container pop-in" style={{ width: '100%', maxWidth: '980px', margin: '0 auto', padding: '0 12px' }}>
      {/* Brand Header / Logo Area */}
      <div className="kiosk-logo-wrapper" style={{ textAlign: 'center', marginBottom: '28px' }}>
        {isOfSupply ? (
          <img
            src="/logo.png"
            alt={config.shopName}
            className="kiosk-brand-logo"
            style={{ maxHeight: '56px', maxWidth: '280px', width: 'auto', objectFit: 'contain', margin: '0 auto' }}
          />
        ) : config.logoUrl ? (
          <img
            src={config.logoUrl}
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
                background: 'var(--accent-primary-light, rgba(245,158,11,0.15))',
                color: 'var(--accent-primary, #F59E0B)'
              }}>
                <ImageIcon size={16} />
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary, #F59E0B)'
              }}>
                YOUR LOGO HERE
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
        
        <p className="kiosk-welcome-subtitle" style={{
          marginTop: '12px',
          fontSize: '1.05rem',
          color: 'var(--text-secondary, #D4D4D8)',
          fontWeight: 600
        }}>
          {config.welcomeShoppingTitle || `Welcome to ${config.shopName}!`} Please tap an option below:
        </p>
      </div>

      {/* ================= EXACTLY TWO BIG HERO CHOICE CARDS ================= */}
      {isOfSupply ? (
        /* OF Supply Mode (Store + Haircuts) */
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
                background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
                color: '#000000',
                boxShadow: '0 10px 28px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Flame size={48} strokeWidth={2.4} />
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
                  padding: '18px 24px',
                  fontSize: '1.12rem',
                  background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
                  color: '#000000',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
                }}
              >
                <Flame size={22} />
                <span>Join Walk-In Line</span>
                <ChevronRight size={22} />
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
              Already booked? Tap to select your barber and notify their station you have arrived.
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

      {/* ================= INSTANT 1-FIELD WALK-IN MODAL ================= */}
      {showWalkInModal && (
        <div className="modal-overlay">
          <div className="futuristic-modal-bubble pop-in">
            <button
              onClick={() => setShowWalkInModal(false)}
              className="modal-close-btn"
            >
              ✕
            </button>

            <div className="modal-header-icon-wrap">
              <div className="modal-fire-icon">
                <Flame size={32} />
              </div>
              <h3 className="modal-main-title">
                Join Walk-In Line
              </h3>
              <p className="modal-sub-title">
                {waitingQueue.length === 0 
                  ? "You will be #1 in line • Ready for next open chair" 
                  : `You will be placed as #${waitingQueue.length + 1} in line • ~${estimatedWait}m wait`}
              </p>
            </div>

            {/* In-Chair Barber Status preview so client knows who is cutting */}
            {inChairClients.length > 0 && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                borderRadius: '16px',
                marginBottom: '18px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Currently in chairs:
                </div>
                {inChairClients.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>{c.barberName}</span>
                    <span style={{ color: '#F59E0B' }}>Cutting {c.clientName}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="modal-input-label">
                  <User size={15} />
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
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                >
                  <Zap size={18} />
                  <span>Join Line Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
