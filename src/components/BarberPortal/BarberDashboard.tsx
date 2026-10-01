import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Megaphone, 
  Trash2, 
  Armchair,
  Scissors,
  Check
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig } from '../../types';
import { storage } from '../../utils/storage';
import { PushNotificationBanner } from './PushNotificationBanner';

interface BarberDashboardProps {
  barbers: Barber[];
  checkIns: CheckInRecord[];
  config: ShopConfig;
  onUpdateStatus: (id: string, status: CheckInRecord['status']) => void;
  onAddWalkinDirect: () => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({
  barbers,
  checkIns,
  config: _config,
  onUpdateStatus
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Tick every second to update elapsed wait times live
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredCheckIns = checkIns.filter(record => {
    if (selectedBarberId === 'all') return true;
    return record.barberId === selectedBarberId || !record.barberId;
  });

  const waitingList = filteredCheckIns.filter(r => r.status === 'waiting' || r.status === 'called');
  const inChairList = filteredCheckIns.filter(r => r.status === 'in_chair');
  const completedList = filteredCheckIns.filter(r => r.status === 'completed');

  const getElapsedTime = (isoString: string) => {
    const diffMs = currentTime - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins < 1) return `${secs}s ago`;
    return `${mins}m ${secs}s ago`;
  };

  const handleCallClient = (record: CheckInRecord) => {
    onUpdateStatus(record.id, 'called');
  };

  const handleSetInChair = (record: CheckInRecord) => {
    onUpdateStatus(record.id, 'in_chair');
  };

  const handleSetCompleted = (record: CheckInRecord) => {
    onUpdateStatus(record.id, 'completed');
  };

  const handleClearHistory = () => {
    if (confirm('Clear completed clients from today\'s live queue?')) {
      storage.clearCompletedCheckIns();
    }
  };

  return (
    <div className="pop-in">
      {/* Push Notification Banner */}
      <PushNotificationBanner
        barbers={barbers}
        onSelectBarberFilter={setSelectedBarberId}
      />

      {/* Top Controls & Station Filter Banner */}
      <div className="portal-header-banner">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 850, color: '#09090B', marginBottom: 4 }}>
            Barber Station & Lobby Queue
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#71717A' }}>
            Real-time client arrivals, live wait timers & station updates
          </p>
        </div>

        {/* Station Filter Tabs */}
        <div className="portal-barber-filter">
          <button
            onClick={() => {
              setSelectedBarberId('all');
            }}
            className={`barber-tab-chip ${selectedBarberId === 'all' ? 'active' : ''}`}
          >
            <Users size={16} />
            <span>All Stations ({checkIns.filter(r => r.status !== 'completed').length})</span>
          </button>

          {barbers.map((barber) => {
            const count = checkIns.filter(
              r => r.barberId === barber.id && (r.status === 'waiting' || r.status === 'called' || r.status === 'in_chair')
            ).length;

            return (
              <button
                key={barber.id}
                onClick={() => {
                  setSelectedBarberId(barber.id);
                }}
                className={`barber-tab-chip ${selectedBarberId === barber.id ? 'active' : ''}`}
              >
                <span>{barber.name}</span>
                {count > 0 && (
                  <span
                    style={{
                      background: selectedBarberId === barber.id ? '#FFFFFF' : '#09090B',
                      color: selectedBarberId === barber.id ? '#09090B' : '#FFFFFF',
                      fontSize: '0.75rem',
                      padding: '1px 7px',
                      borderRadius: 9999,
                      fontWeight: 850
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Overview Pill Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F4F4F5', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 850, color: '#09090B' }}>{waitingList.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717A' }}>Waiting in Lobby</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F4F4F5', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 850, color: '#09090B' }}>{inChairList.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717A' }}>Currently In Chair</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F4F4F5', color: '#71717A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 850, color: '#09090B' }}>{completedList.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717A' }}>Completed Today</div>
          </div>
        </div>
      </div>

      {/* Main Queue Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Waiting Clients</span>
            <span style={{ fontSize: '0.85rem', background: '#F4F4F5', color: '#09090B', padding: '2px 10px', borderRadius: 9999, fontWeight: 700 }}>
              {waitingList.length}
            </span>
          </h3>
        </div>

        {waitingList.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '48px 24px', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 22, background: '#F4F4F5', color: '#71717A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Armchair size={32} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#09090B', marginBottom: 4 }}>No Clients Currently Waiting</h4>
            <p style={{ fontSize: '0.88rem', color: '#71717A', maxWidth: 400, margin: '0 auto' }}>
              When a client walks in and checks in at the front kiosk, their card will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="queue-grid">
            {waitingList.map((record) => (
              <div key={record.id} className="queue-card waiting slide-up">
                <div className="queue-card-top">
                  <div>
                    <span className="time-badge" style={{ marginBottom: 6, display: 'inline-block' }}>
                      {record.appointmentTime || 'Appointment'}
                    </span>
                    <h4 className="client-name-bold">{record.clientName}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#71717A', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={13} />
                      <span>Arrived {getElapsedTime(record.checkInTime)}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#09090B', background: '#F4F4F5', padding: '4px 10px', borderRadius: 9999 }}>
                      For: {record.barberName}
                    </span>
                  </div>
                </div>

                {record.status === 'called' && (
                  <div style={{ background: '#F4F4F5', color: '#09090B', padding: '6px 12px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Megaphone size={14} />
                    <span>Called client • Waiting to take seat</span>
                  </div>
                )}

                <div className="queue-actions">
                  <button
                    onClick={() => handleCallClient(record)}
                    className="btn-action-pill"
                    title="Call client & play audio announcement"
                  >
                    <Megaphone size={16} />
                    <span>Call In</span>
                  </button>

                  <button
                    onClick={() => handleSetInChair(record)}
                    className="btn-action-pill"
                    style={{ background: '#09090B', color: '#FFFFFF' }}
                  >
                    <Scissors size={16} />
                    <span>In Chair</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In Chair Section */}
      {inChairList.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Currently In Chair</span>
            <span style={{ fontSize: '0.85rem', background: '#F4F4F5', color: '#09090B', padding: '2px 10px', borderRadius: 9999, fontWeight: 700 }}>
              {inChairList.length}
            </span>
          </h3>

          <div className="queue-grid">
            {inChairList.map((record) => (
              <div key={record.id} className="queue-card in_chair slide-up">
                <div className="queue-card-top">
                  <div>
                    <span className="time-badge" style={{ marginBottom: 6, display: 'inline-block' }}>
                      ✂️ In Chair
                    </span>
                    <h4 className="client-name-bold">{record.clientName}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#71717A', marginTop: 2 }}>
                      Barber: <strong>{record.barberName}</strong>
                    </div>
                  </div>
                </div>

                <div className="queue-actions">
                  <button
                    onClick={() => handleSetCompleted(record)}
                    className="choice-card-action-btn"
                    style={{ padding: '10px 16px', fontSize: '0.9rem' }}
                  >
                    <Check size={18} />
                    <span>Mark Cut Finished</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Today Section */}
      {completedList.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#71717A' }}>
              Completed Today ({completedList.length})
            </h3>
            <button
              onClick={handleClearHistory}
              className="back-pill-btn"
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              <Trash2 size={13} />
              <span>Clear Completed</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {completedList.map((record) => (
              <div
                key={record.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 16,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.88rem',
                  color: '#71717A'
                }}
              >
                <CheckCircle size={15} color="#09090B" />
                <span style={{ fontWeight: 700, color: '#09090B' }}>{record.clientName}</span>
                <span>({record.barberName})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
