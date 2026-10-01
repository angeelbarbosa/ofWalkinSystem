import { useState, useEffect } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Barber, CheckInRecord, ShopConfig } from '../types';
import { storage } from './storage';
import { notificationManager } from './notifications';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

export function useLiveSystem() {
  const [barbers, setBarbers] = useState<Barber[]>(() => storage.getBarbers());
  const [config, setConfig] = useState<ShopConfig>(() => storage.getConfig());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => storage.getCheckIns());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(!!convexClient);

  useEffect(() => {
    // 1. If Convex Client is available, set up live cloud watch queries
    if (convexClient) {
      try {
        // Watch checkIns
        const checkInsWatch = convexClient.watchQuery(api.checkins.get, {});
        const unsubscribeCheckIns = checkInsWatch.onUpdate(() => {
          const cloudCheckIns = checkInsWatch.localQueryResult();
          if (Array.isArray(cloudCheckIns)) {
            const mapped: CheckInRecord[] = cloudCheckIns.map((c: any) => ({
              id: c._id || c.id,
              clientName: c.clientName,
              clientPhone: c.clientPhone,
              type: (c.type || 'appointment') as any,
              barberId: c.barberId,
              barberName: c.barberName,
              appointmentTime: c.appointmentTime,
              checkInTime: c.checkInTime,
              status: c.status as any,
              notes: c.notes
            }));
            setCheckIns(mapped);
            storage.saveCheckIns(mapped);
          }
        });

        // Watch barbers
        const barbersWatch = convexClient.watchQuery(api.barbers.get, {});
        const unsubscribeBarbers = barbersWatch.onUpdate(() => {
          const cloudBarbers = barbersWatch.localQueryResult();
          if (Array.isArray(cloudBarbers) && cloudBarbers.length > 0) {
            const mapped: Barber[] = cloudBarbers.map((b: any) => ({
              id: b._id || b.id,
              name: b.name,
              nickname: b.nickname || b.name,
              specialty: b.specialty,
              avatar: b.avatar || '',
              avatarColor: b.avatarColor || '#09090B',
              phone: b.phone,
              stationNumber: b.stationNumber,
              isWorking: b.isWorking,
              pushSubscriptionActive: true
            }));
            setBarbers(mapped);
            storage.saveBarbers(mapped);
          } else if (Array.isArray(cloudBarbers) && cloudBarbers.length === 0) {
            convexClient.mutation(api.barbers.seed, {}).catch(() => {});
          }
        });

        // Watch config
        const configWatch = convexClient.watchQuery(api.config.get, {});
        const unsubscribeConfig = configWatch.onUpdate(() => {
          const cloudConfig = configWatch.localQueryResult() as any;
          if (cloudConfig) {
            const merged = { ...storage.getConfig(), ...cloudConfig };
            setConfig(merged);
            storage.saveConfig(merged);
          }
        });

        // Initial seed check
        convexClient.mutation(api.barbers.seed, {}).catch(() => {});

        setIsCloudConnected(true);

        return () => {
          unsubscribeCheckIns();
          unsubscribeBarbers();
          unsubscribeConfig();
        };
      } catch (err) {
        console.warn('Convex connection setup:', err);
      }
    }

    // 2. Local fallback events & BroadcastChannel sync
    const handleBarbersUpdate = () => setBarbers(storage.getBarbers());
    const handleConfigUpdate = () => setConfig(storage.getConfig());
    const handleCheckInsUpdate = () => setCheckIns(storage.getCheckIns());

    window.addEventListener('barbers_updated', handleBarbersUpdate);
    window.addEventListener('config_updated', handleConfigUpdate);
    window.addEventListener('checkins_updated', handleCheckInsUpdate);

    notificationManager.onMessage((data: any) => {
      if (data?.type === 'NEW_CHECKIN') {
        handleCheckInsUpdate();
      }
    });

    return () => {
      window.removeEventListener('barbers_updated', handleBarbersUpdate);
      window.removeEventListener('config_updated', handleConfigUpdate);
      window.removeEventListener('checkins_updated', handleCheckInsUpdate);
    };
  }, []);

  // Actions
  const addCheckIn = async (clientName: string, selectedBarber?: Barber, appointmentTime: string = 'Scheduled') => {
    const barberId = selectedBarber?.id;
    const barberName = selectedBarber?.name || 'Brandon';

    // Push to Convex Cloud if active
    if (convexClient) {
      try {
        await convexClient.mutation(api.checkins.add, {
          clientName,
          type: 'appointment',
          barberId,
          barberName,
          appointmentTime
        });
      } catch {
        // Fallback local
        storage.addCheckIn({
          clientName,
          type: 'appointment',
          barberId,
          barberName,
          appointmentTime
        });
      }
    } else {
      storage.addCheckIn({
        clientName,
        type: 'appointment',
        barberId,
        barberName,
        appointmentTime
      });
    }

    // Trigger phone buzz & push
    notificationManager.sendBarberArrivalAlert(clientName, barberName, appointmentTime);

    const newRecord: CheckInRecord = {
      id: 'chk-' + Date.now(),
      clientName,
      type: 'appointment',
      barberId,
      barberName,
      appointmentTime,
      checkInTime: new Date().toISOString(),
      status: 'waiting'
    };

    return newRecord;
  };

  const updateStatus = async (id: string, status: CheckInRecord['status']) => {
    if (convexClient && id.length > 20) {
      try {
        await convexClient.mutation(api.checkins.updateStatus, {
          id: id as any,
          status
        });
        return;
      } catch {
        // Fallback
      }
    }
    storage.updateCheckInStatus(id, status);
  };

  const saveBarbers = async (updated: Barber[]) => {
    storage.saveBarbers(updated);
    setBarbers(updated);
  };

  const saveConfig = async (updated: ShopConfig) => {
    storage.saveConfig(updated);
    setConfig(updated);
    if (convexClient) {
      try {
        await convexClient.mutation(api.config.update, {
          shopName: updated.shopName,
          welcomeShoppingBody: updated.welcomeShoppingBody,
          autoResetShoppingSec: updated.autoResetShoppingSec,
          autoResetAppointmentSec: updated.autoResetAppointmentSec,
          soundAlertsEnabled: updated.soundAlertsEnabled,
          pinCode: updated.pinCode
        });
      } catch {
        // Fallback
      }
    }
  };

  return {
    barbers,
    config,
    checkIns,
    isCloudConnected,
    addCheckIn,
    updateStatus,
    saveBarbers,
    saveConfig
  };
}
