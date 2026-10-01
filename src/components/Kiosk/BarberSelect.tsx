import React from 'react';
import { ArrowLeft, User } from 'lucide-react';
import type { Barber } from '../../types';

interface BarberSelectProps {
  barbers: Barber[];
  onSelectBarber: (barber: Barber) => void;
  onBack: () => void;
}

export const BarberSelect: React.FC<BarberSelectProps> = ({
  barbers,
  onSelectBarber,
  onBack
}) => {
  const activeBarbers = barbers.filter(b => b.isWorking);

  const handleBarberClick = (barber: Barber) => {
    onSelectBarber(barber);
  };

  return (
    <div className="barber-selection-container pop-in" style={{ maxWidth: '880px' }}>
      {/* Header */}
      <div className="step-header">
        <button className="back-pill-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="step-header-text">
          <h2 className="step-title">
            Who is Your Appointment With?
          </h2>
          <p className="step-subtitle">
            Tap your barber to check in
          </p>
        </div>
      </div>

      {/* Barbers Grid */}
      <div className="barbers-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {activeBarbers.map((barber) => (
          <div
            key={barber.id}
            className="bubbly-barber-card"
            onClick={() => handleBarberClick(barber)}
            role="button"
            tabIndex={0}
            style={{ padding: '32px 20px' }}
          >
            {/* Clean Monochrome Icon Avatar */}
            <div
              className="card-icon-bubble"
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                background: '#F4F4F5',
                color: '#09090B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <User size={44} strokeWidth={2.2} />
            </div>

            <h3 className="barber-card-name" style={{ fontSize: '1.4rem', marginBottom: 6 }}>
              {barber.name}
            </h3>

            <button className="select-barber-btn">
              <span>Select {barber.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
