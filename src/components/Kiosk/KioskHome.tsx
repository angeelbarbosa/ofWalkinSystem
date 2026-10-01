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
    <div className="kiosk-home-container pop-in">
      {/* Brand Logo */}
      <div className="kiosk-logo-wrapper">
        <img
          src="/logo.png"
          alt="Brand Logo"
          className="kiosk-brand-logo"
        />
        <p className="kiosk-welcome-subtitle">
          Welcome in! Please select an option:
        </p>
      </div>

      {/* Exactly 2 Clean, Bubbly Choice Cards */}
      <div className="choice-cards-grid">
        {/* Shopping Card */}
        <div
          className="bubbly-choice-card"
          onClick={handleShopping}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-bubble">
            <ShoppingBag size={48} strokeWidth={2.2} />
          </div>

          <h2 className="choice-card-title">
            Here to Shop
          </h2>
          
          <p className="choice-card-desc">
            Browse store supplies & products
          </p>

          <button className="choice-card-action-btn">
            <span>I'm Shopping</span>
            <ChevronRight size={20} />
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
            <Scissors size={48} strokeWidth={2.2} />
          </div>

          <h2 className="choice-card-title">
            I Have an Appointment
          </h2>
          
          <p className="choice-card-desc">
            Check in with your barber
          </p>

          <button className="choice-card-action-btn">
            <span>Check In</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
