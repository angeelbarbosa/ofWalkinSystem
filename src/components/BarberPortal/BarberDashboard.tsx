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
  BellOff,
  X, 
  CreditCard, 
  DollarSign, 
  LogOut, 
  KeyRound,
  Users,
  AlertTriangle,
  MessageSquare,
  Phone
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord } from '../../types';
import { storage } from '../../utils/storage';
import { BarberRentModal } from './BarberRentModal';
import { ChangePasscodeModal } from './ChangePasscodeModal';
import { ModalOverlay } from '../Shared/ModalOverlay';
import { notificationManager, type ArrivalToastEventData } from '../../utils/notifications';

interface BarberDashboardProps {
  currentBarber?: Barber;
  barbers: Barber[];
  checkIns: CheckInRecord[];
  rentRecords?: RentPaymentRecord[];
  config: ShopConfig;
  onUpdateStatus: (id: string, status: CheckInRecord['status']) => void;
  onClaimWalkIn?: (checkInId: string, barber: Barber, newStatus?: CheckInRecord['status']) => Promise<void> | void;
  onClearCompleted?: () => Promise<void> | void;
  onPayRent?: (barber: Barber, method: RentPaymentRecord['paymentMethod'], feeCovered: boolean) => Promise<RentPaymentRecord>;
  onSaveBarbers?: (barbers: Barber[]) => void;
  onLockStation?: () => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({
  currentBarber,
  barbers,
  checkIns,
  rentRecords = [],
  config,
  onUpdateStatus,
  onClaimWalkIn,
  onClearCompleted,
  onPayRent,
  onSaveBarbers,
  onLockStation
}) => {
  // If a currentBarber was passed from login, use it; otherwise fallback to preference
  const assignedBarber = currentBarber || barbers.find(
    b => b.id === notificationManager.getMyBarberPreference() || b.name.toLowerCase() === notificationManager.getMyBarberPreference().toLowerCase()
  ) || barbers[0];

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeToast, setActiveToast] = useState<ArrivalToastEventData | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [walkInToClaim, setWalkInToClaim] = useState<CheckInRecord | null>(null);
  const [chairOccupiedWarning, setChairOccupiedWarning] = useState<{ attemptedClientName: string; actionType: 'in_chair' | 'take_walkin' } | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [alertsActive, setAlertsActive] = useState<boolean>(() => notificationManager.isAlertsEnabled());
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
    if (status === 'granted' && notificationManager.isAlertsEnabled()) {
      notificationManager.requestPermissionAndSubscribe(assignedBarber.id, assignedBarber.name);
    }
  }, [assignedBarber]);

  // Listen for real-time alert toggle changes
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail !== undefined) {
        setAlertsActive(customEvent.detail.enabled);
      }
    };
    window.addEventListener('barber_alerts_toggle', handleToggle);
    return () => window.removeEventListener('barber_alerts_toggle', handleToggle);
  }, []);

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

  const handleToggleAlerts = async () => {
    if (alertsActive) {
      // Turn alerts OFF
      notificationManager.setAlertsEnabled(false);
      setAlertsActive(false);
    } else {
      // Turn alerts ON
      const perm = notificationManager.getPermissionStatus();
      if (perm !== 'granted') {
        const result = await notificationManager.requestPermissionAndSubscribe(assignedBarber.id, assignedBarber.name);
        setPermission(result.success ? 'granted' : 'denied');
        if (result.success) {
          notificationManager.setAlertsEnabled(true);
          setAlertsActive(true);
          notificationManager.sendBarberArrivalAlert('Test Client', assignedBarber.name, '2:30 PM', assignedBarber.id);
          setTested(true);
          setTimeout(() => setTested(false), 2500);
        }
      } else {
        notificationManager.setAlertsEnabled(true);
        setAlertsActive(true);
        notificationManager.sendBarberArrivalAlert('Test Client', assignedBarber.name, '2:30 PM', assignedBarber.id);
        setTested(true);
        setTimeout(() => setTested(false), 2000);
      }
    }
  };

  const handleSaveNewPasscode = (newPasscode: string) => {
    if (onSaveBarbers) {
      const updated = barbers.map(b => b.id === assignedBarber.id ? { ...b, passcode: newPasscode } : b);
      onSaveBarbers(updated);
    }
  };

  // Helper to determine if a check-in belongs to the general shop walk-in queue
  const isGeneralWalkIn = (record: CheckInRecord) => {
    if (record.type === 'shopping') return false;
    const status = (record.status || 'waiting').toLowerCase();
    if (status === 'in_chair' || status === 'completed') return false;

    // If assigned to a specific barber ID
    if (record.barberId && record.barberId !== 'first_available') {
      return false;
    }

    // If assigned to a known barber name
    if (record.barberName && 
        record.barberName !== 'First Available' && 
        record.barberName !== 'Front Register' && 
        !record.barberName.toLowerCase().includes('first available')) {
      const isKnown = barbers.some(b => b.name.toLowerCase() === record.barberName!.toLowerCase());
      if (isKnown) return false;
    }

    return (
      !record.barberId ||
      record.barberId === 'first_available' ||
      record.barberName === 'First Available' ||
      record.barberName === 'Front Register' ||
      record.barberName?.toLowerCase().includes('first available')
    );
  };

  // Safe sort helper: Longest waiting at the top (#1 / Next Up)
  const sortByLongestWait = (a: CheckInRecord, b: CheckInRecord) => {
    const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
    const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
    return timeA - timeB;
  };

  // General Shop Walk-Ins (Unassigned / First Available in lobby for all barbers)
  const unassignedWalkIns = checkIns
    .filter(record => {
      const status = (record.status || 'waiting').toLowerCase();
      return (status === 'waiting' || status === 'called') && isGeneralWalkIn(record);
    })
    .sort(sortByLongestWait);

  // Filter checkins assigned specifically to THIS barber (appointments or claimed walk-ins)
  const filteredCheckIns = checkIns.filter(record => {
    if (record.type === 'shopping') return false;
    if (isGeneralWalkIn(record)) return false;

    const targetId = (assignedBarber.id || '').trim().toLowerCase();
    const targetName = (assignedBarber.name || '').trim().toLowerCase();
    const recordBarberId = (record.barberId || '').trim().toLowerCase();
    const recordBarberName = (record.barberName || '').trim().toLowerCase();

    return (
      (recordBarberId.length > 0 && (recordBarberId === targetId || recordBarberId === assignedBarber.id)) ||
      (recordBarberName.length > 0 && (recordBarberName === targetName || recordBarberName === assignedBarber.name.toLowerCase()))
    );
  });

  const waitingList = filteredCheckIns
    .filter(r => {
      const status = (r.status || 'waiting').toLowerCase();
      return status === 'waiting' || status === 'called';
    })
    .sort(sortByLongestWait);

  const inChairList = filteredCheckIns.filter(r => (r.status || '').toLowerCase() === 'in_chair');
  const completedList = filteredCheckIns.filter(r => (r.status || '').toLowerCase() === 'completed');

  const isChairOccupied = inChairList.length > 0;
  const activeInChairClient = inChairList[0] as CheckInRecord | undefined;

  const getElapsedTime = (isoString?: string) => {
    if (!isoString) return '0s ago';
    const diffMs = currentTime - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins < 1) return `${secs}s ago`;
    return `${mins}m ${secs}s ago`;
  };

  // Initiate Taking a Walk-In (with Chair Occupancy Guard)
  const handleInitiateTakeWalkIn = (walkin: CheckInRecord) => {
    if (isChairOccupied && activeInChairClient) {
      setChairOccupiedWarning({
        attemptedClientName: walkin.clientName,
        actionType: 'take_walkin'
      });
      return;
    }
    setWalkInToClaim(walkin);
  };

  // Confirm Claim Walk-In Handler
  const handleConfirmClaim = async (targetStatus: CheckInRecord['status'] = 'waiting') => {
    if (!walkInToClaim) return;
    const targetId = walkInToClaim.id;
    setWalkInToClaim(null);

    // Hard block if chair is occupied
    if (isChairOccupied) {
      setChairOccupiedWarning({
        attemptedClientName: walkInToClaim.clientName,
        actionType: 'take_walkin'
      });
      return;
    }

    if (onClaimWalkIn) {
      await onClaimWalkIn(targetId, assignedBarber, targetStatus);
    } else {
      storage.claimCheckIn(targetId, assignedBarber.id, assignedBarber.name, targetStatus);
      onUpdateStatus(targetId, targetStatus);
    }
  };

  // 1-Tap Pre-filled Native SMS Link Generator (Free, instant, opens Messages on iOS / Android)
  const getSmsUrl = (phone: string, clientName: string, customText?: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const shopName = config?.shopName || 'the shop';
    const defaultMsg = `Hey ${clientName}! ${assignedBarber.name} is ready for you in the chair at ${shopName}! 💈`;
    const message = customText || defaultMsg;
    return `sms:${cleanPhone}?&body=${encodeURIComponent(message)}`;
  };

  const handleCallClient = (record: CheckInRecord) => {
    onUpdateStatus(record.id, 'called');
    if (record.clientPhone) {
      window.location.href = getSmsUrl(record.clientPhone, record.clientName);
    }
  };

  // Safe In-Chair Handler with Chair Occupancy Protection
  const handleSetInChair = (record: CheckInRecord) => {
    if (isChairOccupied && activeInChairClient && activeInChairClient.id !== record.id) {
      // Chair is already occupied - block and display clear warning message
      setChairOccupiedWarning({
        attemptedClientName: record.clientName,
        actionType: 'in_chair'
      });
      return;
    }
    onUpdateStatus(record.id, 'in_chair');
  };

  const handleSetCompleted = (record: CheckInRecord) => {
    onUpdateStatus(record.id, 'completed');
  };

  const handleClearHistory = () => {
    if (confirm(`Clear completed cuts from ${barberDisplayName}'s history?`)) {
      if (onClearCompleted) {
        onClearCompleted();
      } else {
        storage.clearCompletedCheckIns();
      }
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
                Client Arrived
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

      {/* Station Header Bar: Profile Info + Top Right Booth Rent Pill + Action Buttons */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 15,
                background: assignedBarber.avatarColor || 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              {assignedBarber.name.charAt(0)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {assignedBarber.name}
                </h2>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: permission === 'granted' ? 'var(--pastel-green)' : 'var(--text-muted, #71717A)',
                    display: 'inline-block'
                  }}
                />
                <span>{permission === 'granted' ? 'Live Alerts Active' : 'Alerts Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Top Right: Booth Rent Badge & Subtle Switch Station Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {onPayRent && (
              <button
                onClick={() => setIsRentModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 12px',
                  background: isRentPaidThisCycle ? 'var(--pastel-green-bg)' : 'var(--pastel-amber-bg)',
                  border: `1px solid ${isRentPaidThisCycle ? 'var(--pastel-green-border)' : 'var(--pastel-amber-border)'}`,
                  color: isRentPaidThisCycle ? 'var(--pastel-green)' : 'var(--pastel-amber)',
                  borderRadius: 9999,
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                title={isRentPaidThisCycle ? 'Rent Paid - View Receipt' : 'Rent Due - Pay Online'}
              >
                {isRentPaidThisCycle ? <DollarSign size={13} /> : <CreditCard size={13} />}
                <span>{isRentPaidThisCycle ? `Rent Paid ($${assignedBarber.weeklyRent || 200})` : `Pay Rent: $${assignedBarber.weeklyRent || 200}`}</span>
              </button>
            )}

            {onLockStation && (
              <button
                onClick={onLockStation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 10px',
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  color: 'var(--text-muted)',
                  borderRadius: 9999,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Switch Station / Exit"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Row (Live Alerts & Station PIN) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, width: '100%' }}>
          <button
            onClick={handleToggleAlerts}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px',
              background: alertsActive 
                ? 'var(--pastel-green-bg, rgba(16, 185, 129, 0.15))' 
                : 'var(--surface-pill, #27272A)',
              color: alertsActive 
                ? 'var(--pastel-green, #10B981)' 
                : 'var(--text-secondary, #A1A1AA)',
              border: alertsActive 
                ? '1px solid var(--pastel-green-border, rgba(16, 185, 129, 0.3))' 
                : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 14,
              fontSize: '0.78rem',
              fontWeight: 750,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={alertsActive ? 'Live Alerts are ON (Tap to turn OFF / Mute)' : 'Live Alerts are OFF (Tap to turn ON)'}
          >
            {alertsActive ? (
              <Bell size={14} style={{ color: 'var(--pastel-green, #10B981)' }} />
            ) : (
              <BellOff size={14} style={{ color: 'var(--text-muted, #71717A)' }} />
            )}
            <span>{tested ? 'Alert Synced!' : 'Live Alerts'}</span>
          </button>

          {/* Change PIN Button */}
          <button
            onClick={() => setIsPasscodeModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '10px',
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 14,
              fontSize: '0.78rem',
              fontWeight: 750,
              cursor: 'pointer'
            }}
            title="Change station 4-digit passcode"
          >
            <KeyRound size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Station PIN</span>
          </button>
        </div>
      </div>

      {/* 3-Column Quick Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {/* Appointments / Station Queue */}
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
            Appointments
          </div>
        </div>

        {/* In Chair */}
        <div style={{
          background: isChairOccupied ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-card, #18181B)',
          padding: '12px 10px',
          borderRadius: 18,
          border: isChairOccupied ? '1px solid #10B981' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1 }}>
            {inChairList.length}
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isChairOccupied ? '#10B981' : 'var(--text-secondary)', marginTop: 3 }}>
            {isChairOccupied ? 'Chair Busy' : 'In Chair'}
          </div>
        </div>

        {/* Live Walk-In Queue */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          padding: '12px 10px',
          borderRadius: 18,
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: unassignedWalkIns.length > 0 ? 'var(--accent-primary)' : 'var(--text-muted)', lineHeight: 1.1 }}>
            {unassignedWalkIns.length}
          </div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 3 }}>
            Live Walk-Ins
          </div>
        </div>
      </div>

      {/* SECTION 1: Currently In Your Chair */}
      {inChairList.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Currently in Your Chair</span>
              <span style={{ fontSize: '0.75rem', background: '#10B981', color: '#000000', padding: '2px 8px', borderRadius: 9999, fontWeight: 900 }}>
                {inChairList.length}
              </span>
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 750 }}>
              In Service
            </span>
          </div>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#10B981',
                        color: '#000000',
                        textTransform: 'uppercase'
                      }}
                    >
                      In Progress
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--pastel-green, #10B981)', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      <span>Cutting for {getElapsedTime(record.statusUpdatedAt || record.checkInTime)}</span>
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {record.clientName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{record.appointmentTime ? `Appointment: ${record.appointmentTime}` : 'Walk-In Customer'}</span>
                    {record.clientPhone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--pastel-green)', fontWeight: 750 }}>
                        <Phone size={12} />
                        {record.clientPhone}
                      </span>
                    )}
                    {record.notes && <span>• {record.notes}</span>}
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
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease'
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

      {/* SECTION 2: My Checked-In Appointments (Booked specifically for this barber) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span>My Checked-In Appointments</span>
              <span style={{ fontSize: '0.74rem', background: 'var(--accent-primary, #F59E0B)', color: '#000000', padding: '2px 8px', borderRadius: 9999, fontWeight: 900 }}>
                {waitingList.length}
              </span>
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
              Clients checked in for {barberDisplayName} • Longest waiting at top
            </p>
          </div>
        </div>

        {waitingList.length === 0 ? (
          <div style={{
            background: 'var(--surface-card, #18181B)',
            borderRadius: 22,
            padding: '28px 18px',
            textAlign: 'center',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-muted, #71717A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              <Armchair size={22} />
            </div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              No appointments waiting right now
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 320, margin: '0 auto' }}>
              When a client arrives and checks in for {barberDisplayName} at the kiosk, they appear here instantly.
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
                        {index === 0 ? 'Next Up' : `#${index + 1} in line`}
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
                      {record.notes && <span>• {record.notes}</span>}
                    </div>
                  </div>
                </div>

                {/* 1-Tap SMS Text Notification Bar (Pre-filled instant message) */}
                {record.clientPhone && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    borderRadius: 14,
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 750 }}>
                      <Phone size={13} style={{ color: 'var(--accent-primary)' }} />
                      <span>{record.clientPhone}</span>
                    </div>
                    <a
                      href={getSmsUrl(record.clientPhone, record.clientName)}
                      onClick={() => {
                        if (record.status === 'waiting') {
                          onUpdateStatus(record.id, 'called');
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        background: 'var(--accent-primary, #F59E0B)',
                        color: '#000000',
                        borderRadius: 10,
                        fontSize: '0.78rem',
                        fontWeight: 850,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                        cursor: 'pointer'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>💬 Text Client</span>
                    </a>
                  </div>
                )}

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

                {/* Action Buttons */}
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
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Megaphone size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span>{record.clientPhone ? 'Call & Text' : 'Call In'}</span>
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
                      background: isChairOccupied 
                        ? 'var(--surface-pill, #27272A)'
                        : 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
                      color: isChairOccupied ? 'var(--text-primary)' : '#000000',
                      border: isChairOccupied ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                      cursor: 'pointer',
                      boxShadow: isChairOccupied ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                    title={isChairOccupied ? `Chair currently occupied by ${activeInChairClient?.clientName}` : 'Seat in chair'}
                  >
                    <Scissors size={15} style={{ color: isChairOccupied ? 'var(--accent-primary)' : '#000000' }} />
                    <span>{isChairOccupied ? 'Chair Busy' : 'In Chair'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Live Walk-in Queue */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span style={{ color: 'var(--accent-primary)' }}>Live Walk-in Queue</span>
              <span style={{ fontSize: '0.74rem', background: unassignedWalkIns.length > 0 ? 'var(--accent-primary)' : 'var(--surface-pill)', color: unassignedWalkIns.length > 0 ? '#000000' : 'var(--text-secondary)', padding: '2px 8px', borderRadius: 9999, fontWeight: 900 }}>
                {unassignedWalkIns.length}
              </span>
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
              Lobby walk-ins waiting for next available barber • Longest waiting at top
            </p>
          </div>
        </div>

        {unassignedWalkIns.length === 0 ? (
          <div style={{
            background: 'var(--surface-card, #18181B)',
            borderRadius: 20,
            padding: '24px 16px',
            textAlign: 'center',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-muted, #71717A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <Users size={20} />
            </div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px' }}>
              Live walk-in queue is clear
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              No unassigned walk-in clients waiting in the lobby.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unassignedWalkIns.map((walkin, index) => (
              <div
                key={walkin.id}
                className="slide-up"
                style={{
                  background: 'var(--surface-card, #18181B)',
                  border: index === 0 ? '2px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                  borderRadius: 18,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: index === 0 ? '0 4px 16px rgba(245, 158, 11, 0.12)' : undefined
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '1px 6px', 
                      borderRadius: 4, 
                      background: index === 0 ? 'var(--accent-primary)' : 'var(--surface-pill)', 
                      color: index === 0 ? '#000000' : 'var(--accent-primary)', 
                      textTransform: 'uppercase' 
                    }}>
                      {index === 0 ? 'Longest Wait • Next' : `#${index + 1} Walk-In`}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-primary)' }}>
                    {walkin.clientName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={11} />
                      <span>Arrived {getElapsedTime(walkin.checkInTime)}</span>
                    </span>
                    {walkin.clientPhone && (
                      <a
                        href={getSmsUrl(walkin.clientPhone, walkin.clientName)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          color: 'var(--accent-primary)',
                          fontWeight: 750,
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={11} />
                        <span>{walkin.clientPhone}</span>
                      </a>
                    )}
                    {walkin.notes && <span>• {walkin.notes}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {walkin.clientPhone && (
                    <a
                      href={getSmsUrl(walkin.clientPhone, walkin.clientName)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 12px',
                        background: 'var(--surface-pill, #27272A)',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                        color: 'var(--accent-primary)',
                        borderRadius: 14,
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                      title="1-Tap Text Client"
                    >
                      <MessageSquare size={14} />
                    </a>
                  )}

                  <button
                    onClick={() => handleInitiateTakeWalkIn(walkin)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      background: isChairOccupied ? 'var(--surface-pill, #27272A)' : 'var(--accent-primary, #F59E0B)',
                      color: isChairOccupied ? 'var(--text-primary)' : '#000000',
                      border: isChairOccupied ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                      borderRadius: 14,
                      fontSize: '0.84rem',
                      fontWeight: 850,
                      cursor: 'pointer',
                      boxShadow: isChairOccupied ? 'none' : '0 3px 10px rgba(245, 158, 11, 0.28)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                    title={isChairOccupied ? `Chair currently occupied by ${activeInChairClient?.clientName}` : 'Take walk-in'}
                  >
                    <Scissors size={14} style={{ color: isChairOccupied ? 'var(--accent-primary)' : '#000000' }} />
                    <span>Take Walk-In</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Finished Today */}
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

      {/* Confirmation Popup Modal for Taking a Walk-In (Only accessible when chair is free) */}
      {walkInToClaim && !isChairOccupied && (
        <ModalOverlay onClose={() => setWalkInToClaim(null)} maxWidth={440}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, #D97706 100%)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)'
            }}>
              <Scissors size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Take Walk-In Client?
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Assign to {assignedBarber.name}
            </p>
          </div>

          {/* Client Highlight Card */}
          <div style={{
            background: 'var(--surface-pill, #27272A)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
            borderRadius: 18,
            padding: '16px',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {walkInToClaim.clientName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: 4, fontWeight: 750, flexWrap: 'wrap' }}>
              <Clock size={13} />
              <span>Waiting {getElapsedTime(walkInToClaim.checkInTime)}</span>
              {walkInToClaim.clientPhone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-primary)' }}>
                  • <Phone size={12} style={{ color: 'var(--accent-primary)' }} /> {walkInToClaim.clientPhone}
                </span>
              )}
              {walkInToClaim.notes && <span>• {walkInToClaim.notes}</span>}
            </div>
          </div>

          {/* Action Choices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Button 1 (Top): Text client something... */}
            {walkInToClaim.clientPhone ? (
              <a
                href={`sms:${walkInToClaim.clientPhone.replace(/[^\d+]/g, '')}`}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 16,
                  background: 'var(--surface-pill, #27272A)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageSquare size={17} style={{ color: 'var(--accent-primary)' }} />
                <span>Text client something...</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => alert('Client did not provide a phone number at check-in.')}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 16,
                  background: 'var(--surface-pill, #27272A)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxSizing: 'border-box'
                }}
              >
                <MessageSquare size={17} style={{ color: 'var(--text-muted)' }} />
                <span>Text client something... (No Phone)</span>
              </button>
            )}

            {/* Button 2: Seat in Chair Now (Start Cut) */}
            <button
              onClick={() => handleConfirmClaim('in_chair')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#000000',
                border: 'none',
                fontSize: '0.96rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Scissors size={18} />
              <span>Seat in Chair Now (Start Cut)</span>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setWalkInToClaim(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #71717A)',
                fontSize: '0.84rem',
                fontWeight: 750,
                cursor: 'pointer',
                marginTop: 2
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Chair Occupied Warning Modal (When trying to seat someone or take a walkin while chair is busy) */}
      {chairOccupiedWarning && activeInChairClient && (
        <ModalOverlay onClose={() => setChairOccupiedWarning(null)} maxWidth={420}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #EF4444',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.25)'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Chair Currently Occupied
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              {assignedBarber.name}'s Chair
            </p>
          </div>

          <div style={{
            background: 'var(--surface-pill, #27272A)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
            borderRadius: 18,
            padding: '16px',
            marginBottom: 18,
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', marginBottom: 4 }}>
              Action Blocked
            </div>
            <div>
              You are currently cutting <strong style={{ color: '#FAFAFA' }}>{activeInChairClient.clientName}</strong>.
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 6 }}>
              {chairOccupiedWarning.actionType === 'take_walkin' 
                ? `You cannot take ${chairOccupiedWarning.attemptedClientName} from the lobby queue while cutting. Please tap "Mark Cut Finished" on your current client first.`
                : `You cannot seat ${chairOccupiedWarning.attemptedClientName} until you tap "Mark Cut Finished" on your current client.`
              }
            </div>
          </div>

          <button
            onClick={() => setChairOccupiedWarning(null)}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 16,
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              border: 'none',
              fontSize: '0.94rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
            }}
          >
            Got It
          </button>
        </ModalOverlay>
      )}

      {/* Barber Rent Payment Modal */}
      {isRentModalOpen && onPayRent && (
        <BarberRentModal
          barber={assignedBarber}
          config={config}
          existingRecord={myRentRecord}
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
