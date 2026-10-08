import React from 'react';
import { ArrowLeft, User, Scissors, Sparkles } from 'lucide-react';
import type { Barber, CheckInRecord } from '../../types';

interface BarberSelectProps {
  barbers: Barber[];
  checkIns?: CheckInRecord[];
  mode?: 'appointment' | 'walkin';
  onSelectBarber: (barber: Barber) => void;
  onSelectFirstAvailable?: () => void;
  onBack: () => void;
}

export const BarberSelect: React.FC<BarberSelectProps> = ({
  barbers,
  checkIns = [],
  mode = 'appointment',
  onSelectBarber,
  onSelectFirstAvailable,
  onBack
}) => {
  const activeBarbers = barbers.filter(b => b.isWorking);

  // Helper to determine barber's live activity status
  const getBarberLiveStatus = (barberId: string) => {
    const inChair = checkIns.find(c => (c.barberId === barberId || c.barberName === barberId) && c.status === 'in_chair');
    if (inChair) {
      return {
        status: 'in_chair' as const,
        label: 'In Chair (Cutting Client)',
        detail: `Currently with ${inChair.clientName}`,
        badgeColor: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        dotColor: '#F59E0B'
      };
    }

    const waiting = checkIns.filter(c => (c.barberId === barberId || c.barberName === barberId) && (c.status === 'waiting' || c.status === 'called'));
    if (waiting.length > 0) {
      return {
        status: 'waiting' as const,
        label: `${waiting.length} in Lobby Queue`,
        detail: `Next up: ${waiting[0].clientName}`,
        badgeColor: '#3B82F6',
        badgeBg: 'rgba(59, 130, 246, 0.15)',
        dotColor: '#3B82F6'
      };
    }

    return {
      status: 'available' as const,
      label: 'Chair Open • Ready Now',
      detail: 'Available immediately',
      badgeColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      dotColor: '#10B981'
    };
  };

  // Special "First Available" virtual barber
  const handleFirstAvailableClick = () => {
    if (onSelectFirstAvailable) {
      onSelectFirstAvailable();
    } else {
      // Find first available or least busy barber
      const freeBarber = activeBarbers.find(b => getBarberLiveStatus(b.id).status === 'available') || activeBarbers[0];
      if (freeBarber) {
        onSelectBarber(freeBarber);
      }
    }
  };

  return (
    <div className="barber-selection-container pop-in" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', padding: '0 12px' }}>
      {/* Step Header */}
      <div className="step-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="back-pill-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="step-header-text">
          <h2 className="step-title" style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
            {mode === 'walkin' ? 'Select a Barber or First Available' : 'Who is Your Appointment With?'}
          </h2>
          <p className="step-subtitle" style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {mode === 'walkin'
              ? 'Join the walk-in rotation queue below'
              : 'Tap your barber to notify their station you have arrived'}
          </p>
        </div>
      </div>

      {/* WALK-IN MODE: Highlight First Available Option */}
      {mode === 'walkin' && (
        <div
          onClick={handleFirstAvailableClick}
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.06) 100%)',
            border: '2px solid var(--accent-primary, #F59E0B)',
            borderRadius: '24px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  First Available Barber (Fastest Wait)
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  background: 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}>
                  Recommended
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Get assigned to whichever barber finishes next • Shortest queue
              </p>
            </div>
          </div>

          <button
            style={{
              padding: '12px 20px',
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Auto-Assign</span>
          </button>
        </div>
      )}

      {/* Barbers Grid */}
      <div
        className="barbers-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '18px'
        }}
      >
        {activeBarbers.map((barber) => {
          const liveStatus = getBarberLiveStatus(barber.id);

          return (
            <div
              key={barber.id}
              className="bubbly-barber-card"
              onClick={() => onSelectBarber(barber)}
              role="button"
              tabIndex={0}
              style={{
                background: 'var(--surface-card, #18181B)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: '24px',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Barber Avatar */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 24,
                  backgroundColor: barber.avatarColor || 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 10,
                  marginBottom: 14,
                  boxShadow: `0 8px 20px ${barber.avatarColor || '#F59E0B'}40`,
                  overflow: 'hidden'
                }}
              >
                {barber.avatar ? (
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={38} strokeWidth={2.4} />
                )}
              </div>

              {/* Barber Name */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                {barber.name}
              </h3>

              {/* Live Status Badge */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  background: liveStatus.badgeBg,
                  color: liveStatus.badgeColor,
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '14px'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: liveStatus.dotColor,
                    boxShadow: `0 0 6px ${liveStatus.dotColor}`
                  }}
                />
                <span>{liveStatus.label}</span>
              </div>

              {/* Action Button */}
              <button
                className="select-barber-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                  color: 'var(--text-primary)',
                  borderRadius: '9999px',
                  fontSize: '0.88rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Scissors size={14} />
                <span>Select {barber.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
