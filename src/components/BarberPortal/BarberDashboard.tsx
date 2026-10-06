import React, { useState, useEffect } from 'react';
import { 
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
  DollarSign,
  Lock,
  KeyRound,
  Vibrate,
  Smartphone,
  Plus
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord } from '../../types';
import { storage } from '../../utils/storage';
import { BarberRentModal } from './BarberRentModal';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { notificationManager, type ArrivalToastEventData } from '../../utils/notifications';

interface BarberDashboardProps {
  currentBarber?: Barber;
  barbers: Barber[];
  checkIns: CheckInRecord[];
  rentRecords?: RentPaymentRecord[];
  config: ShopConfig;
  onUpdateStatus: (id: string, status: CheckInRecord['status']) => void;
  onPayRent?: (barber: Barber, method: RentPaymentRecord['paymentMethod'], feeCovered: boolean) => Promise<RentPaymentRecord>;
  onSaveBarbers?: (barbers: Barber[]) => void;
  onLockStation?: () => void;
  onAddWalkinDirect: () => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({
  currentBarber,
  barbers,
  checkIns,
  rentRecords = [],
  config: _config,
  onUpdateStatus,
  onPayRent,
  onSaveBarbers,
  onLockStation,
  onAddWalkinDirect
}) => {
  // If a currentBarber was passed from login, use it; otherwise fallback to preference
  const assignedBarber = currentBarber || barbers.find(
    b => b.id === notificationManager.getMyBarberPreference() || b.name.toLowerCase() === notificationManager.getMyBarberPreference().toLowerCase()
  ) || barbers[0];

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeToast, setActiveToast] = useState<ArrivalToastEventData | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [tested, setTested] = useState(false);

  const barberDisplayName = assignedBarber.name;

  // Barber Booth Rent status
  const myRentRecord = rentRecords.find(r => r.barberId === assignedBarber.id && r.status === 'paid');
  const isRentPaidThisCycle = !!myRentRecord;

  // Tick every second to update elapsed wait times live
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Notification permissions & subscription
  useEffect(() => {
    const status = notificationManager.getPermissionStatus();
    setPermission(status);
    if (status === 'granted') {
      notificationManager.requestPermissionAndSubscribe(assignedBarber.id, assignedBarber.name);
    }
  }, [assignedBarber]);

  // Listen for real-time in-app arrival toast events
  useEffect(() => {
    const handleArrivalToast = (e: Event) => {
      const customEvent = e as CustomEvent<ArrivalToastEventData>;
      if (customEvent.detail) {
        // Only show toast if targeted to this barber or broadcast
        const detail = customEvent.detail;
        if (!detail.barberId || detail.barberId === assignedBarber.id || detail.barberName.toLowerCase() === assignedBarber.name.toLowerCase()) {
          setActiveToast(detail);
        }
      }
    };

    window.addEventListener('barber_arrival_toast', handleArrivalToast);
    return () => window.removeEventListener('barber_arrival_toast', handleArrivalToast);
  }, [assignedBarber]);

  // Auto-dismiss toast after 10 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleEnablePush = async () => {
    const result = await notificationManager.requestPermissionAndSubscribe(assignedBarber.id, assignedBarber.name);
    setPermission(result.success ? 'granted' : 'denied');
    if (result.success) {
      notificationManager.sendBarberArrivalAlert('Test Client', assignedBarber.name, '2:30 PM', assignedBarber.id);
      setTested(true);
    }
  };

  const handleTestAlert = async () => {
    await notificationManager.requestPermissionAndSubscribe(assignedBarber.id, assignedBarber.name);
    notificationManager.sendBarberArrivalAlert('Test Client', assignedBarber.name, '2:30 PM', assignedBarber.id);
    setTested(true);
  };

  const handleSaveNewPasscode = (newPasscode: string) => {
    if (onSaveBarbers) {
      const updated = barbers.map(b => b.id === assignedBarber.id ? { ...b, passcode: newPasscode } : b);
      onSaveBarbers(updated);
    }
  };

  // Filter checkins for this barber only
  const filteredCheckIns = checkIns.filter(record => {
    const target = assignedBarber.name.toLowerCase();
    return (
      record.barberId === assignedBarber.id ||
      (record.barberName && record.barberName.toLowerCase() === target)
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
    if (confirm(`Clear completed cuts from ${barberDisplayName}'s history?`)) {
      storage.clearCompletedCheckIns();
    }
  };

  return (
    <div className="pop-in" style={{ position: 'relative', width: '100%', maxWidth: 680, margin: '0 auto' }}>
      {/* Floating In-App Arrival Toast Banner */}
      {activeToast && (
        <div
          className="slide-down"
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 24px)',
            maxWidth: 480,
            background: 'var(--surface-card, #18181B)',
            border: '2px solid var(--accent-primary, #F59E0B)',
            color: 'var(--text-primary, #FAFAFA)',
            borderRadius: 22,
            padding: '14px 18px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary, #F59E0B)', fontWeight: 800 }}>
                🔔 Client Arrived
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 850, color: 'var(--text-primary, #FAFAFA)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeToast.clientName} is here!
              </div>
              {activeToast.appointmentTime && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #A1A1AA)' }}>
                  {activeToast.appointmentTime} • In lobby
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setActiveToast(null)}
              style={{
                background: 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                border: 'none',
                padding: '7px 12px',
                borderRadius: 9999,
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Check size={13} />
              <span>Got it</span>
            </button>
            <button
              onClick={() => setActiveToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #71717A)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Station Header Bar: Profile Info + Compact Mobile Action Strip */}
      <div
        className="slide-down"
        style={{
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
          borderRadius: 24,
          padding: '16px 18px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 16
        }}
      >
        {/* Top Info Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                background: assignedBarber.avatarColor || 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              {assignedBarber.name.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {assignedBarber.name}
                </h2>
                <span
                  style={{
                    background: 'var(--surface-pill, #27272A)',
                    color: 'var(--accent-primary, #F59E0B)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Station #{assignedBarber.stationNumber}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: permission === 'granted' ? '#10B981' : '#F59E0B',
                    display: 'inline-block'
                  }}
                />
                <span>{permission === 'granted' ? 'Phone Alerts Ready' : 'Alerts Not Enabled'}</span>
              </div>
            </div>
          </div>

          {/* Quick Lock Station Icon for security */}
          {onLockStation && (
            <button
              onClick={onLockStation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                background: 'var(--surface-pill, #27272A)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                color: 'var(--text-primary)',
                borderRadius: 9999,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Lock station screen"
            >
              <Lock size={12} />
              <span>Lock</span>
            </button>
          )}
        </div>

        {/* Bottom Responsive Action Buttons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
          {permission !== 'granted' ? (
            <button
              onClick={handleEnablePush}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 10px',
                background: 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                border: 'none',
                borderRadius: 12,
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Smartphone size={13} />
              <span>Enable Push</span>
            </button>
          ) : (
            <button
              onClick={handleTestAlert}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 10px',
                background: 'var(--surface-pill, #27272A)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: 12,
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Send a quick test vibration/sound alert to this device"
            >
              <Vibrate size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>{tested ? 'Buzzed!' : 'Test Buzz'}</span>
            </button>
          )}

          {/* Change PIN Button */}
          <button
            onClick={() => setIsPasscodeModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '8px 10px',
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 12,
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Change station 4-digit passcode"
          >
            <KeyRound size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Change PIN</span>
          </button>

          {/* Quick Add Walk-In Directly for this barber */}
          <button
            onClick={onAddWalkinDirect}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '8px 10px',
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 12,
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Directly add walk-in client to queue"
          >
            <Plus size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Add Walk-In</span>
          </button>
        </div>
      </div>

      {/* Booth Rent Strip for this Barber */}
      {onPayRent && (
        <div
          className="slide-up"
          style={{
            background: isRentPaidThisCycle 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--surface-card, #18181B) 100%)' 
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, var(--surface-card, #18181B) 100%)',
            border: isRentPaidThisCycle 
              ? '1px solid rgba(16, 185, 129, 0.35)' 
              : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 20,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: isRentPaidThisCycle ? '#10B981' : '#F59E0B',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <DollarSign size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isRentPaidThisCycle
                  ? `Rent Paid ($${assignedBarber.weeklyRent || 200})`
                  : `Rent Due: $${assignedBarber.weeklyRent || 200}.00`}
              </div>
              <div style={{ fontSize: '0.72rem', color: isRentPaidThisCycle ? '#10B981' : '#F59E0B' }}>
                {isRentPaidThisCycle
                  ? `Receipt #${myRentRecord?.receiptNumber}`
                  : `Due every ${assignedBarber.rentDueDay || 'Monday'}`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsRentModalOpen(true)}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              borderRadius: 9999,
              background: isRentPaidThisCycle ? 'var(--surface-pill, #27272A)' : 'var(--accent-primary, #F59E0B)',
              color: isRentPaidThisCycle ? 'var(--text-primary)' : '#000000',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0
            }}
          >
            <CreditCard size={13} />
            <span>{isRentPaidThisCycle ? 'Receipt' : 'Pay Rent'}</span>
          </button>
        </div>
      )}

      {/* Sleek 3-Column Personal Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {/* Waiting */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          padding: '12px 10px',
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-primary, #F59E0B)', lineHeight: 1.1 }}>
            {waitingList.length}
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 3 }}>
            Waiting
          </div>
        </div>

        {/* In Chair */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          padding: '12px 10px',
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1 }}>
            {inChairList.length}
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 3 }}>
            In Chair
          </div>
        </div>

        {/* Completed */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          padding: '12px 10px',
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {completedList.length}
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 3 }}>
            Completed
          </div>
        </div>
      </div>

      {/* Main Waiting Queue Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <span>Waiting for Your Station</span>
            <span style={{ fontSize: '0.75rem', background: 'var(--accent-primary, #F59E0B)', color: '#000000', padding: '2px 8px', borderRadius: 9999, fontWeight: 900 }}>
              {waitingList.length}
            </span>
          </h3>
        </div>

        {waitingList.length === 0 ? (
          <div style={{
            background: 'var(--surface-card, #18181B)',
            borderRadius: 22,
            padding: '32px 18px',
            textAlign: 'center',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-muted, #71717A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              <Armchair size={24} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              No clients waiting right now
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto' }}>
              When a client checks in for {barberDisplayName} or joins the walk-in rotation, they appear here instantly.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {waitingList.map((record, index) => (
              <div
                key={record.id}
                className="slide-up"
                style={{
                  background: 'var(--surface-card, #18181B)',
                  borderRadius: 22,
                  padding: '16px 18px',
                  border: index === 0 ? '2px solid var(--accent-primary, #F59E0B)' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  boxShadow: index === 0 ? '0 8px 24px rgba(245, 158, 11, 0.2)' : 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* Client info top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: index === 0 ? 'var(--accent-primary, #F59E0B)' : 'var(--surface-pill, #27272A)',
                          color: index === 0 ? '#000000' : 'var(--text-primary)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {index === 0 ? '🔥 Next Up' : `#${index + 1} in line`}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {record.appointmentTime || 'Walk-In'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                      {record.clientName}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Clock size={12} />
                      <span>Arrived {getElapsedTime(record.checkInTime)}</span>
                    </div>
                  </div>
                </div>

                {record.status === 'called' && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--accent-primary, #F59E0B)',
                    padding: '6px 12px',
                    borderRadius: 12,
                    fontSize: '0.78rem',
                    fontWeight: 750,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Megaphone size={14} />
                    <span>Called client • Ready to take seat</span>
                  </div>
                )}

                {/* Big, thumb-friendly Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
                  <button
                    onClick={() => handleCallClient(record)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: 'var(--surface-pill, #27272A)',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Megaphone size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span>Call In</span>
                  </button>

                  <button
                    onClick={() => handleSetInChair(record)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      fontSize: '0.88rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
                      color: '#000000',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                    }}
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
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Currently in Your Chair</span>
            <span style={{ fontSize: '0.75rem', background: '#10B981', color: '#000000', padding: '2px 8px', borderRadius: 9999, fontWeight: 900 }}>
              {inChairList.length}
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inChairList.map((record) => (
              <div
                key={record.id}
                className="slide-up"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--surface-card, #18181B) 100%)',
                  border: '2px solid #10B981',
                  borderRadius: 22,
                  padding: '18px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#10B981',
                      color: '#000000',
                      display: 'inline-block',
                      marginBottom: 4,
                      textTransform: 'uppercase'
                    }}
                  >
                    ✂️ In Service
                  </span>
                  <h4 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {record.clientName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    {record.appointmentTime ? `Appointment: ${record.appointmentTime}` : 'Walk-In Customer'}
                  </div>
                </div>

                <button
                  onClick={() => handleSetCompleted(record)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 16,
                    fontSize: '0.96rem',
                    fontWeight: 900,
                    background: '#10B981',
                    color: '#000000',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Check size={18} />
                  <span>Mark Cut Finished</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Today Section */}
      {completedList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>
              Finished Today ({completedList.length})
            </h3>
            <button
              onClick={handleClearHistory}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {completedList.map((record) => (
              <div
                key={record.id}
                style={{
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  borderRadius: 12,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)'
                }}
              >
                <CheckCircle size={13} style={{ color: '#10B981' }} />
                <span style={{ fontWeight: 750 }}>{record.clientName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barber Rent Payment Modal */}
      {isRentModalOpen && onPayRent && (
        <BarberRentModal
          barber={assignedBarber}
          onPayRent={onPayRent}
          onClose={() => setIsRentModalOpen(false)}
        />
      )}

      {/* Change Passcode Modal */}
      {isPasscodeModalOpen && (
        <ChangePasscodeModal
          barber={assignedBarber}
          onSaveNewPasscode={handleSaveNewPasscode}
          onClose={() => setIsPasscodeModalOpen(false)}
        />
      )}
    </div>
  );
};
