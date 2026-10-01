import React from 'react';
import { ShoppingBag, Scissors, ChevronRight } from 'lucide-react';
import type { ShopConfig } from '../../types';

interface KioskHomeProps {
  config: ShopConfig;
  onSelectShopping: () => void;
  onSelectAppointment: () => void;
}

export const KioskHome: React.FC<KioskHomeProps> = ({
  onSelectShopping,
  onSelectAppointment
}) => {
  const handleShopping = () => {
    onSelectShopping();
  };

  const handleAppointment = () => {
    onSelectAppointment();
  };

  return (
    <div className="pop-in" style={{ width: '100%', maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
      {/* Brand Logo (No store name text) */}
      <div style={{ marginBottom: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="Brand Logo"
          style={{
            height: '92px',
            width: 'auto',
            objectFit: 'contain',
            marginBottom: '16px',
            filter: 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.08))'
          }}
        />
        <p style={{ fontSize: '1.25rem', color: '#52525B', fontWeight: 600 }}>
          Welcome in! Please select an option:
        </p>
      </div>

      {/* Exactly 2 Clean, Bubbly Choice Cards */}
      <div className="choice-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* Shopping Card */}
        <div
          className="bubbly-choice-card"
          onClick={handleShopping}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-bubble">
            <ShoppingBag size={54} strokeWidth={2.2} />
          </div>

          <h2 className="choice-card-title">
            Here to Shop
          </h2>
          
          <p className="choice-card-desc">
            Browse store supplies & products
          </p>

          <button className="choice-card-action-btn">
            <span>I'm Shopping</span>
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Appointment Card */}
        <div
          className="bubbly-choice-card"
          onClick={handleAppointment}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-bubble">
            <Scissors size={54} strokeWidth={2.2} />
          </div>

          <h2 className="choice-card-title">
            I Have an Appointment
          </h2>
          
          <p className="choice-card-desc">
            Check in with your barber
          </p>

          <button className="choice-card-action-btn">
            <span>Check In</span>
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
