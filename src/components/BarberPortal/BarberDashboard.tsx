import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Megaphone, 
  Trash2, 
  Armchair,
  Scissors,
  Check,
  Bell,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord } from '../../types';
import { storage } from '../../utils/storage';
import { PushNotificationBanner } from './PushNotificationBanner';
import { BarberRentModal } from './BarberRentModal';
import { notificationManager, type ArrivalToastEventData } from '../../utils/notifications';

interface BarberDashboardProps {
  barbers: Barber[];
  checkIns: CheckInRecord[];
  rentRecords?: RentPaymentRecord[];
  config: ShopConfig;
  onUpdateStatus: (id: string, status: CheckInRecord['status']) => void;
  onPayRent?: (barber: Barber, method: RentPaymentRecord['paymentMethod'], feeCovered: boolean) => Promise<RentPaymentRecord>;
  onAddWalkinDirect: () => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({
  barbers,
  checkIns,
  rentRecords = [],
  config: _config,
  onUpdateStatus,
  onPayRent
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>(() => notificationManager.getMyBarberPreference());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeToast, setActiveToast] = useState<ArrivalToastEventData | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);

  const assignedBarber = barbers.find(
    b => b.id === selectedBarberId || b.name.toLowerCase() === selectedBarberId.toLowerCase()
  );
  const isSingleBarberMode = selectedBarberId !== 'all' && selectedBarberId !== '';
  const barberDisplayName = assignedBarber ? assignedBarber.name : (selectedBarberId === 'all' ? 'All Barbers' : selectedBarberId);

  // Barber Booth Rent status
  const myRentRecord = assignedBarber ? rentRecords.find(r => r.barberId === assignedBarber.id && r.status === 'paid') : null;
  const isRentPaidThisCycle = !!myRentRecord;

  // Tick every second to update elapsed wait times live
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time in-app arrival toast events
  useEffect(() => {
    const handleArrivalToast = (e: Event) => {
      const customEvent = e as CustomEvent<ArrivalToastEventData>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);
      }
    };

    window.addEventListener('barber_arrival_toast', handleArrivalToast);
    return () => window.removeEventListener('barber_arrival_toast', handleArrivalToast);
  }, []);

  // Auto-dismiss toast after 10 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const filteredCheckIns = checkIns.filter(record => {
    if (selectedBarberId === 'all' || !selectedBarberId) return true;
    const target = selectedBarberId.toLowerCase();
    return (
      record.barberId === selectedBarberId ||
      (record.barberName && record.barberName.toLowerCase() === target) ||
      (assignedBarber && record.barberName && record.barberName.toLowerCase() === assignedBarber.name.toLowerCase())
    );
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
    if (confirm(`Clear completed cuts from ${isSingleBarberMode ? `${barberDisplayName}'s history` : 'today\'s queue'}?`)) {
      storage.clearCompletedCheckIns();
    }
  };

  return (
    <div className="pop-in" style={{ position: 'relative' }}>
      {/* Floating In-App Arrival Toast Banner */}
      {activeToast && (
        <div
          className="slide-down"
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 32px)',
            maxWidth: 500,
            background: '#09090B',
            color: '#FFFFFF',
            borderRadius: 20,
            padding: '16px 20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#FFFFFF',
                color: '#09090B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A1A1AA', fontWeight: 700 }}>
                🔔 Client Arrived
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 850, color: '#FFFFFF', marginTop: 1 }}>
                {activeToast.clientName} is here for you!
              </div>
              {activeToast.appointmentTime && (
                <div style={{ fontSize: '0.8rem', color: '#D4D4D8', marginTop: 2 }}>
                  Appointment: <strong>{activeToast.appointmentTime}</strong> • Waiting in lobby
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setActiveToast(null)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 9999,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Check size={14} />
              <span>Got it</span>
            </button>
            <button
              onClick={() => setActiveToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#A1A1AA',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Minimal Header & Barber Identity */}
      <PushNotificationBanner
        barbers={barbers}
        selectedBarberId={selectedBarberId}
        onSelectBarberFilter={setSelectedBarberId}
      />

      {/* Single Barber: Booth Rent Status Bar */}
      {isSingleBarberMode && assignedBarber && onPayRent && (
        <div
          className="slide-up"
          style={{
            background: isRentPaidThisCycle ? '#F0FDF4' : '#FFFBEB',
            border: isRentPaidThisCycle ? '1px solid #BBF7D0' : '1px solid #FDE68A',
            borderRadius: 18,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: isRentPaidThisCycle ? '#22C55E' : '#EAB308',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DollarSign size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#09090B' }}>
                {isRentPaidThisCycle
                  ? `Booth Rent Paid for This Week ($${assignedBarber.weeklyRent || 200})`
                  : `Booth Rent Due: $${assignedBarber.weeklyRent || 200}.00`}
              </div>
              <div style={{ fontSize: '0.78rem', color: isRentPaidThisCycle ? '#15803D' : '#92400E' }}>
                {isRentPaidThisCycle
                  ? `Receipt #${myRentRecord?.receiptNumber} • Verified in shop ledger`
                  : `Due every ${assignedBarber.rentDueDay || 'Monday'} • Pay directly with Apple Pay or card`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsRentModalOpen(true)}
            className="choice-card-action-btn"
            style={{
              width: 'auto',
              padding: '8px 16px',
              fontSize: '0.82rem',
              borderRadius: 9999,
              background: '#09090B'
            }}
          >
            <CreditCard size={14} />
            <span>{isRentPaidThisCycle ? 'View Receipt / Re-Pay' : 'Pay Rent Now'}</span>
          </button>
        </div>
      )}

      {/* Multi-Station Filter Banner (Only shown if Shop Manager / All Barbers mode) */}
      {!isSingleBarberMode && (
        <div className="portal-header-banner" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 850, color: '#09090B', marginBottom: 2 }}>
              Shop Manager Queue
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#71717A' }}>
              All stations live overview
            </p>
          </div>

          <div className="portal-barber-filter">
            <button
              onClick={() => setSelectedBarberId('all')}
              className={`barber-tab-chip ${selectedBarberId === 'all' ? 'active' : ''}`}
            >
              <Users size={15} />
              <span>All Stations ({checkIns.filter(r => r.status !== 'completed').length})</span>
            </button>

            {barbers.map((barber) => {
              const count = checkIns.filter(
                r => r.barberId === barber.id && (r.status === 'waiting' || r.status === 'called' || r.status === 'in_chair')
              ).length;

              return (
                <button
                  key={barber.id}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`barber-tab-chip ${selectedBarberId === barber.id ? 'active' : ''}`}
                >
                  <span>{barber.name}</span>
                  {count > 0 && (
                    <span
                      style={{
                        background: selectedBarberId === barber.id ? '#FFFFFF' : '#09090B',
                        color: selectedBarberId === barber.id ? '#09090B' : '#FFFFFF',
                        fontSize: '0.72rem',
                        padding: '1px 6px',
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
      )}

      {/* Personal Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F4F4F5', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B' }}>{waitingList.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717A' }}>
              {isSingleBarberMode ? 'Waiting for You' : 'Waiting in Lobby'}
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F4F4F5', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B' }}>{inChairList.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717A' }}>
              {isSingleBarberMode ? 'In Your Chair' : 'Currently in Chair'}
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F4F4F5', color: '#71717A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#09090B' }}>{completedList.length}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717A' }}>
              {isSingleBarberMode ? 'Your Cuts Today' : 'Completed Today'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 850, color: '#09090B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{isSingleBarberMode ? 'Your Waiting Clients' : 'Waiting Clients'}</span>
            <span style={{ fontSize: '0.8rem', background: '#09090B', color: '#FFFFFF', padding: '2px 9px', borderRadius: 9999, fontWeight: 700 }}>
              {waitingList.length}
            </span>
          </h3>
        </div>

        {waitingList.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: '40px 20px', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: '#F4F4F5', color: '#71717A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Armchair size={26} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#09090B', marginBottom: 4 }}>
              {isSingleBarberMode ? `No clients waiting for ${barberDisplayName}` : 'No Clients Currently Waiting'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#71717A', maxWidth: 360, margin: '0 auto' }}>
              {isSingleBarberMode
                ? 'When a customer checks in for your station, they will appear here.'
                : 'When a walk-in or appointment checks in, their card will appear here.'}
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
                    <div style={{ fontSize: '0.82rem', color: '#71717A', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={12} />
                      <span>Arrived {getElapsedTime(record.checkInTime)}</span>
                    </div>
                  </div>

                  {!isSingleBarberMode && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#09090B', background: '#F4F4F5', padding: '4px 10px', borderRadius: 9999 }}>
                        For: {record.barberName}
                      </span>
                    </div>
                  )}
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
                  >
                    <Megaphone size={15} />
                    <span>Call In</span>
                  </button>

                  <button
                    onClick={() => handleSetInChair(record)}
                    className="btn-action-pill"
                    style={{ background: '#09090B', color: '#FFFFFF' }}
                  >
                    <Scissors size={15} />
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
          <h3 style={{ fontSize: '1.15rem', fontWeight: 850, color: '#09090B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{isSingleBarberMode ? 'Currently in Your Chair' : 'Currently in Chair'}</span>
            <span style={{ fontSize: '0.8rem', background: '#09090B', color: '#FFFFFF', padding: '2px 9px', borderRadius: 9999, fontWeight: 700 }}>
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
                    <div style={{ fontSize: '0.82rem', color: '#71717A', marginTop: 2 }}>
                      {record.appointmentTime ? `Appointment: ${record.appointmentTime}` : 'Walk-In'}
                    </div>
                  </div>
                </div>

                <div className="queue-actions">
                  <button
                    onClick={() => handleSetCompleted(record)}
                    className="choice-card-action-btn"
                    style={{ padding: '10px 16px', fontSize: '0.88rem' }}
                  >
                    <Check size={16} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#71717A' }}>
              {isSingleBarberMode ? `Your Finished Cuts Today (${completedList.length})` : `Completed Today (${completedList.length})`}
            </h3>
            <button
              onClick={handleClearHistory}
              className="back-pill-btn"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {completedList.map((record) => (
              <div
                key={record.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  padding: '7px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem',
                  color: '#71717A'
                }}
              >
                <CheckCircle size={14} color="#09090B" />
                <span style={{ fontWeight: 700, color: '#09090B' }}>{record.clientName}</span>
                {!isSingleBarberMode && <span>({record.barberName})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barber Rent Payment Modal */}
      {isRentModalOpen && assignedBarber && onPayRent && (
        <BarberRentModal
          barber={assignedBarber}
          onPayRent={onPayRent}
          onClose={() => setIsRentModalOpen(false)}
        />
      )}
    </div>
  );
};
