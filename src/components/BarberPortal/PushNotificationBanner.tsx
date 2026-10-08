import React, { useState, useEffect } from 'react';
import { Vibrate, RefreshCw, X, ShieldCheck } from 'lucide-react';
import type { Barber } from '../../types';
import { notificationManager } from '../../utils/notifications';

interface PushNotificationBannerProps {
  barbers: Barber[];
  selectedBarberId: string;
  onSelectBarberFilter: (barberId: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  barbers,
  selectedBarberId,
  onSelectBarberFilter
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [alertsActive, setAlertsActive] = useState<boolean>(() => notificationManager.isAlertsEnabled());
  const [isEditingIdentity, setIsEditingIdentity] = useState<boolean>(() => {
    const pref = notificationManager.getMyBarberPreference();
    return !pref || pref === 'all';
  });
  const [tested, setTested] = useState(false);

  const assignedBarber = barbers.find(
    b => b.id === selectedBarberId || b.name.toLowerCase() === selectedBarberId.toLowerCase()
  );

  const displayName = assignedBarber
    ? assignedBarber.name
    : (selectedBarberId === 'all' ? 'All Barbers (Shop Manager)' : selectedBarberId);

  useEffect(() => {
    const status = notificationManager.getPermissionStatus();
    setPermission(status);
    if (status === 'granted' && notificationManager.isAlertsEnabled()) {
      const targetId = assignedBarber?.id || selectedBarberId || 'all';
      const targetName = assignedBarber?.name || (selectedBarberId === 'all' ? 'All Barbers' : selectedBarberId);
      notificationManager.requestPermissionAndSubscribe(targetId, targetName);
    }
  }, [assignedBarber, selectedBarberId]);

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

  const handleSelectDeviceBarber = (barber: Barber | 'all') => {
    const id = barber === 'all' ? 'all' : barber.id;
    const name = barber === 'all' ? 'all' : barber.name;
    notificationManager.setMyBarberPreference(name);
    onSelectBarberFilter(id);
    setIsEditingIdentity(false);

    if (permission === 'granted' && alertsActive) {
      notificationManager.requestPermissionAndSubscribe(id, name);
    }
  };

  const handleToggleAlerts = async () => {
    if (alertsActive) {
      notificationManager.setAlertsEnabled(false);
      setAlertsActive(false);
    } else {
      const perm = notificationManager.getPermissionStatus();
      const targetId = assignedBarber?.id || selectedBarberId || 'all';
      const targetName = assignedBarber?.name || (selectedBarberId === 'all' ? 'All Barbers' : selectedBarberId);
      if (perm !== 'granted') {
        const result = await notificationManager.requestPermissionAndSubscribe(targetId, targetName);
        setPermission(result.success ? 'granted' : 'denied');
        if (result.success) {
          notificationManager.setAlertsEnabled(true);
          setAlertsActive(true);
          const currentBarberName = assignedBarber?.name || 'Your Station';
          notificationManager.sendBarberArrivalAlert('Test Client', currentBarberName, '2:30 PM', assignedBarber?.id);
          setTested(true);
          setTimeout(() => setTested(false), 2500);
        }
      } else {
        notificationManager.setAlertsEnabled(true);
        setAlertsActive(true);
        const currentBarberName = assignedBarber?.name || 'Your Station';
        notificationManager.sendBarberArrivalAlert('Test Client', currentBarberName, '2:30 PM', assignedBarber?.id);
        setTested(true);
        setTimeout(() => setTested(false), 2000);
      }
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* 1. Collapsed Minimal View: Clean Barber Header */}
      {!isEditingIdentity && (
        <div
          className="slide-up"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            borderRadius: 20,
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#09090B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 900
              }}
            >
              {displayName === 'All Barbers (Shop Manager)' ? 'OF' : displayName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 850, color: '#09090B', lineHeight: 1.2 }}>
                {displayName === 'All Barbers (Shop Manager)' ? 'All Stations (Shop Manager)' : `${displayName}'s Station`}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#71717A', display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: alertsActive ? '#22C55E' : '#71717A',
                    display: 'inline-block'
                  }}
                />
                <span>{alertsActive ? 'Phone Alerts Active' : 'Alerts Disabled'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleToggleAlerts}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 750,
                background: alertsActive 
                  ? 'var(--pastel-green-bg, rgba(16, 185, 129, 0.15))' 
                  : 'var(--surface-pill, #27272A)',
                color: alertsActive 
                  ? 'var(--pastel-green, #10B981)' 
                  : 'var(--text-secondary, #A1A1AA)',
                border: alertsActive 
                  ? '1px solid var(--pastel-green-border, rgba(16, 185, 129, 0.3))' 
                  : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={alertsActive ? 'Live Alerts are ON (Click to turn OFF / Mute)' : 'Live Alerts are OFF (Click to turn ON)'}
            >
              <Vibrate size={14} style={{ color: alertsActive ? 'var(--pastel-green, #10B981)' : 'var(--text-muted, #71717A)' }} />
              <span>{tested ? 'Buzzed!' : 'Live Alerts'}</span>
            </button>

            <button
              onClick={() => setIsEditingIdentity(true)}
              className="back-pill-btn"
              style={{ background: '#F4F4F5', color: '#52525B', padding: '8px 14px', fontSize: '0.82rem' }}
            >
              <RefreshCw size={13} />
              <span>Switch Barber</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Expanded Selector: When picking or switching a barber */}
      {isEditingIdentity && (
        <div
          className="slide-down"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E4E4E7',
            borderRadius: 20,
            padding: '18px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#09090B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} />
              Who is using this device?
            </span>
            {selectedBarberId && selectedBarberId !== '' && (
              <button
                onClick={() => setIsEditingIdentity(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717A',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {barbers.map((b) => {
              const isSelected = selectedBarberId === b.id || selectedBarberId.toLowerCase() === b.name.toLowerCase();
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelectDeviceBarber(b)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 9999,
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    background: isSelected ? '#09090B' : '#F4F4F5',
                    color: isSelected ? '#FFFFFF' : '#09090B',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {b.name}
                </button>
              );
            })}

            <button
              onClick={() => handleSelectDeviceBarber('all')}
              style={{
                padding: '8px 16px',
                borderRadius: 9999,
                fontSize: '0.85rem',
                fontWeight: 700,
                background: selectedBarberId === 'all' ? '#09090B' : '#F4F4F5',
                color: selectedBarberId === 'all' ? '#FFFFFF' : '#71717A',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s'
              }}
            >
              All Barbers (Shop Manager)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



