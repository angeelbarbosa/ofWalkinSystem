import React, { useState, useEffect } from 'react';
import { Vibrate, Smartphone, RefreshCw, X, ShieldCheck } from 'lucide-react';
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
    if (status === 'granted') {
      const targetId = assignedBarber?.id || selectedBarberId || 'all';
      const targetName = assignedBarber?.name || (selectedBarberId === 'all' ? 'All Barbers' : selectedBarberId);
      notificationManager.requestPermissionAndSubscribe(targetId, targetName);
    }
  }, [assignedBarber, selectedBarberId]);

  const handleSelectDeviceBarber = (barber: Barber | 'all') => {
    const id = barber === 'all' ? 'all' : barber.id;
    const name = barber === 'all' ? 'all' : barber.name;
    notificationManager.setMyBarberPreference(name);
    onSelectBarberFilter(id);
    setIsEditingIdentity(false);

    if (permission === 'granted') {
      notificationManager.requestPermissionAndSubscribe(id, name);
    }
  };

  const handleEnablePush = async () => {
    const targetId = assignedBarber?.id || selectedBarberId || 'all';
    const targetName = assignedBarber?.name || (selectedBarberId === 'all' ? 'All Barbers' : selectedBarberId);
    const result = await notificationManager.requestPermissionAndSubscribe(targetId, targetName);
    setPermission(result.success ? 'granted' : 'denied');
    if (result.success) {
      const currentBarberName = assignedBarber?.name || 'Your Station';
      notificationManager.sendBarberArrivalAlert('Test Client', currentBarberName, '2:30 PM', assignedBarber?.id);
      setTested(true);
    }
  };

  const handleTestAlert = async () => {
    const targetId = assignedBarber?.id || selectedBarberId || 'all';
    const targetName = assignedBarber?.name || (selectedBarberId === 'all' ? 'All Barbers' : selectedBarberId);
    await notificationManager.requestPermissionAndSubscribe(targetId, targetName);
    const currentBarberName = assignedBarber?.name || 'Your Station';
    notificationManager.sendBarberArrivalAlert('Test Client', currentBarberName, '2:30 PM', assignedBarber?.id);
    setTested(true);
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
                    background: permission === 'granted' ? '#22C55E' : '#EAB308',
                    display: 'inline-block'
                  }}
                />
                <span>{permission === 'granted' ? 'Phone Alerts Active' : 'Tap to enable lockscreen alerts'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {permission !== 'granted' ? (
              <button
                onClick={handleEnablePush}
                className="choice-card-action-btn"
                style={{ padding: '8px 16px', fontSize: '0.85rem', width: 'auto' }}
              >
                <Smartphone size={15} />
                <span>Enable Alerts</span>
              </button>
            ) : (
              <button
                onClick={handleTestAlert}
                className="back-pill-btn"
                style={{ background: '#F4F4F5', color: '#09090B', padding: '8px 14px', fontSize: '0.82rem' }}
                title="Send a quick test notification to this phone"
              >
                <Vibrate size={14} />
                <span>{tested ? 'Buzzed!' : 'Test Buzz'}</span>
              </button>
            )}

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



