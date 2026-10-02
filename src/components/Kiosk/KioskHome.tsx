import React from 'react';
import { ShoppingBag, Scissors, ChevronRight, CreditCard, Sparkles, UserCheck } from 'lucide-react';
import type { ShopConfig } from '../../types';

interface KioskHomeProps {
  config: ShopConfig;
  onSelectBrowsing: () => void;
  onSelectCheckout: () => void;
  onSelectAppointment: () => void;
}

export const KioskHome: React.FC<KioskHomeProps> = ({
  onSelectBrowsing,
  onSelectCheckout,
  onSelectAppointment
}) => {
  return (
    <div className="kiosk-home-container pop-in">
      {/* Brand Logo */}
      <div className="kiosk-logo-wrapper">
        <img
          src="/logo.png"
          alt="OF Barber & Supply"
          className="kiosk-brand-logo"
        />
        <p className="kiosk-welcome-subtitle">
          Welcome in! Please select an option:
        </p>
      </div>

      {/* Exactly 2 Clean, Bubbly Choice Cards */}
      <div className="choice-cards-grid">
        {/* 1. Supply Store Card */}
        <div className="bubbly-choice-card shopping-card-split">
          <div className="card-icon-bubble">
            <ShoppingBag size={46} strokeWidth={2.2} />
          </div>

          <h2 className="choice-card-title">
            Here to Shop
          </h2>
          
          <p className="choice-card-desc">
            Barber supplies, clippers, tools & grooming products
          </p>

          {/* Dual Action Buttons for Shopper */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            {/* Button 1: Browsing */}
            <button
              onClick={onSelectBrowsing}
              className="btn-action-pill"
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '0.96rem',
                fontWeight: 750,
                background: '#F4F4F5',
                color: '#09090B',
                border: '1px solid #E4E4E7',
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={18} />
              <span>I'm Browsing Supplies</span>
            </button>

            {/* Button 2: Ready to Checkout */}
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

          {/* Persistent Helper Banner */}
          <div
            style={{
              marginTop: 16,
              padding: '8px 12px',
              background: '#FAFAFA',
              border: '1px dashed #E4E4E7',
              borderRadius: 14,
              fontSize: '0.78rem',
              color: '#71717A',
              lineHeight: 1.35
            }}
          >
            💡 <strong>Done shopping?</strong> Return here and tap <strong>"Ready to Checkout"</strong> to call staff to the register.
          </div>
        </div>

        {/* 2. Barber Appointment Card */}
        <div
          className="bubbly-choice-card"
          onClick={onSelectAppointment}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-bubble">
            <Scissors size={46} strokeWidth={2.2} />
          </div>

          <h2 className="choice-card-title">
            I Have an Appointment
          </h2>
          
          <p className="choice-card-desc">
            Check in for your scheduled haircut or grooming session
          </p>

          <div style={{ width: '100%', marginTop: 'auto' }}>
            <button className="choice-card-action-btn" style={{ padding: '16px 20px', fontSize: '1.05rem' }}>
              <UserCheck size={20} />
              <span>Check In with Barber</span>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Persistent Helper Banner */}
          <div
            style={{
              marginTop: 16,
              padding: '8px 12px',
              background: '#FAFAFA',
              border: '1px dashed #E4E4E7',
              borderRadius: 14,
              fontSize: '0.78rem',
              color: '#71717A',
              lineHeight: 1.35
            }}
          >
            ✂️ Tap to select your barber and notify them on their station.
          </div>
        </div>
      </div>
    </div>
  );
};
