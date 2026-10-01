import React, { useState, useEffect } from 'react';
import { Bell, Vibrate, CheckCircle, Smartphone, UserCheck, RefreshCw, X } from 'lucide-react';
import type { Barber } from '../../types';
import { notificationManager } from '../../utils/notifications';

interface PushNotificationBannerProps {
  barbers: Barber[];
  onSelectBarberFilter: (barberId: string) => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  barbers,
  onSelectBarberFilter
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [deviceBarberId, setDeviceBarberId] = useState<string>(() => notificationManager.getMyBarberPreference());
  const [isEditingIdentity, setIsEditingIdentity] = useState<boolean>(() => {
    const pref = notificationManager.getMyBarberPreference();
    return !pref || pref === 'all';
  });
  const [tested, setTested] = useState(false);

  useEffect(() => {
    setPermission(notificationManager.getPermissionStatus());
  }, []);

  const assignedBarber = barbers.find(
    b => b.id === deviceBarberId || b.name.toLowerCase() === deviceBarberId.toLowerCase()
  );

  const displayName = assignedBarber
    ? assignedBarber.name
    : (deviceBarberId === 'all' ? 'All Barbers (Shop Manager)' : deviceBarberId);

  const handleSelectDeviceBarber = (barber: Barber | 'all') => {
    const id = barber === 'all' ? 'all' : barber.id;
    const name = barber === 'all' ? 'all' : barber.name;
    setDeviceBarberId(id);
    notificationManager.setMyBarberPreference(name);
    onSelectBarberFilter(id);
    setIsEditingIdentity(false);
  };

  const handleEnablePush = async () => {
    const granted = await notificationManager.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      const currentBarberName = assignedBarber?.name || 'Your Station';
      notificationManager.sendBarberArrivalAlert('Test Client', currentBarberName, '2:30 PM', assignedBarber?.id);
      setTested(true);
    }
  };

  const handleTestAlert = () => {
    const currentBarberName = assignedBarber?.name || 'Your Station';
    notificationManager.sendBarberArrivalAlert('Test Client', currentBarberName, '2:30 PM', assignedBarber?.id);
    setTested(true);
  };

  return (
    <div
      className="slide-up"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4E4E7',
        borderRadius: 20,
        padding: '18px 22px',
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: permission === 'granted' ? '#09090B' : '#F4F4F5',
              color: permission === 'granted' ? '#FFFFFF' : '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {permission === 'granted' ? <CheckCircle size={22} /> : <Bell size={22} />}
          </div>
          <div>
            <div style={{ fontWeight: 850, color: '#09090B', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{permission === 'granted' ? 'Lockscreen & Buzz Alerts Active' : 'Setup Phone Lockscreen Alerts'}</span>
              {assignedBarber && (
                <span style={{ fontSize: '0.75rem', background: '#09090B', color: '#FFFFFF', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                  For {assignedBarber.name}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.83rem', color: '#71717A' }}>
              {permission === 'granted'
                ? `Only ${assignedBarber ? assignedBarber.name : 'your chosen barber'} will receive vibration and lockscreen banners on this device.`
                : 'Select who uses this phone and enable alerts so your phone buzzes when your clients arrive.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {permission !== 'granted' ? (
            <button
              onClick={handleEnablePush}
              className="choice-card-action-btn"
              style={{ padding: '10px 20px', fontSize: '0.9rem', width: 'auto' }}
            >
              <Smartphone size={16} />
              <span>Enable Phone Alerts</span>
            </button>
          ) : (
            <button
              onClick={handleTestAlert}
              className="back-pill-btn"
              style={{ background: '#F4F4F5', color: '#09090B', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Vibrate size={16} />
              <span>{tested ? 'Test Again' : 'Test Phone Buzz'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Device Identity Selection / Confirmation */}
      <div style={{ paddingTop: 10, borderTop: '1px solid #F4F4F5' }}>
        {!isEditingIdentity && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#71717A', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck size={14} />
                This Phone Belongs To:
              </span>
              <span
                style={{
                  background: '#09090B',
                  color: '#FFFFFF',
                  padding: '5px 14px',
                  borderRadius: 9999,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <CheckCircle size={14} color="#FFFFFF" />
                <span>{displayName}</span>
              </span>
            </div>

            <button
              onClick={() => setIsEditingIdentity(true)}
              style={{
                background: '#F4F4F5',
                color: '#09090B',
                border: '1px solid #E4E4E7',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E4E4E7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F4F4F5';
              }}
            >
              <RefreshCw size={12} />
              <span>Switch Barber / Misclicked?</span>
            </button>
          </div>
        )}

        {isEditingIdentity && (
          <div className="slide-down" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#09090B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserCheck size={14} />
                Select who uses this phone (notifications will only buzz this device):
              </span>
              {deviceBarberId && deviceBarberId !== 'all' && (
                <button
                  onClick={() => setIsEditingIdentity(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#71717A',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <X size={12} />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSelectDeviceBarber('all')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 9999,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: deviceBarberId === 'all' ? '#09090B' : '#F4F4F5',
                  color: deviceBarberId === 'all' ? '#FFFFFF' : '#52525B',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s'
                }}
              >
                All Barbers (Shop Manager)
              </button>

              {barbers.map((b) => {
                const isSelected = deviceBarberId === b.id || deviceBarberId.toLowerCase() === b.name.toLowerCase();
                return (
                  <button
                    key={b.id}
                    onClick={() => handleSelectDeviceBarber(b)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 9999,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: isSelected ? '#09090B' : '#F4F4F5',
                      color: isSelected ? '#FFFFFF' : '#52525B',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

