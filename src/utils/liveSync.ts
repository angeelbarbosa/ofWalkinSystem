import { useState, useEffect, useRef } from 'react';
import { api } from '../../convex/_generated/api';
import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord } from '../types';
import { storage } from './storage';
import { notificationManager } from './notifications';
import { convexClient } from './convexClient';

export { convexClient };

export function useLiveSystem() {
  const [barbers, setBarbers] = useState<Barber[]>(() => storage.getBarbers());
  const [config, setConfig] = useState<ShopConfig>(() => storage.getConfig());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => storage.getCheckIns());
  const [rentRecords, setRentRecords] = useState<RentPaymentRecord[]>(() => storage.getRentRecords());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(!!convexClient);

  const knownCheckInIdsRef = useRef<Set<string>>(new Set());
  const isInitialCheckInsLoadRef = useRef<boolean>(true);

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

            // Check for newly arrived clients in real time from cloud
            if (isInitialCheckInsLoadRef.current) {
              mapped.forEach((c) => knownCheckInIdsRef.current.add(c.id));
              isInitialCheckInsLoadRef.current = false;
            } else {
              mapped.forEach((c) => {
                if (!knownCheckInIdsRef.current.has(c.id)) {
                  knownCheckInIdsRef.current.add(c.id);
                  if (c.status === 'waiting' || c.status === 'called') {
                    notificationManager.triggerLocalAlert(
                      c.clientName,
                      c.barberName || '',
                      c.appointmentTime,
                      c.barberId
                    );
                  }
                }
              });
            }

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
              pushSubscriptionActive: true,
              weeklyRent: b.weeklyRent ?? 200,
              rentCycle: b.rentCycle ?? 'weekly',
              rentDueDay: b.rentDueDay ?? 'Monday',
              autoPayEnabled: b.autoPayEnabled ?? false
            }));
            setBarbers(mapped);
            storage.saveBarbers(mapped);
          } else if (Array.isArray(cloudBarbers) && cloudBarbers.length === 0 && convexClient) {
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
    const handleRentUpdate = () => setRentRecords(storage.getRentRecords());

    window.addEventListener('barbers_updated', handleBarbersUpdate);
    window.addEventListener('config_updated', handleConfigUpdate);
    window.addEventListener('checkins_updated', handleCheckInsUpdate);
    window.addEventListener('rent_updated', handleRentUpdate);

    notificationManager.onMessage((data: any) => {
      if (data?.type === 'NEW_CHECKIN') {
        handleCheckInsUpdate();
        if (data.clientName) {
          notificationManager.triggerLocalAlert(
            data.clientName,
            data.barberName || '',
            data.appointmentTime,
            data.barberId
          );
        }
      }
    });

    return () => {
      window.removeEventListener('barbers_updated', handleBarbersUpdate);
      window.removeEventListener('config_updated', handleConfigUpdate);
      window.removeEventListener('checkins_updated', handleCheckInsUpdate);
      window.removeEventListener('rent_updated', handleRentUpdate);
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
    notificationManager.sendBarberArrivalAlert(clientName, barberName, appointmentTime, barberId);

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

  // Booth Rent Actions
  const payBoothRent = async (
    barber: Barber,
    method: RentPaymentRecord['paymentMethod'] = 'apple_pay',
    feeCovered: boolean = true
  ): Promise<RentPaymentRecord> => {
    const baseAmount = barber.weeklyRent || config.defaultWeeklyRent || 200;
    const fee = feeCovered ? Number(((baseAmount * 0.029) + 0.30).toFixed(2)) : 0;
    const total = baseAmount + fee;

    const newRecord = storage.recordRentPayment({
      barberId: barber.id,
      barberName: barber.name,
      stationNumber: barber.stationNumber,
      amount: baseAmount,
      processingFee: fee,
      totalPaid: total,
      feeCoveredByBarber: feeCovered,
      periodDescription: `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      dueDate: new Date().toISOString().split('T')[0],
      paidAt: new Date().toISOString(),
      status: 'paid',
      paymentMethod: method,
      notes: `Paid via ${method === 'apple_pay' ? 'Apple Pay' : method === 'card' ? 'Card' : method.toUpperCase()}`
    });

    setRentRecords(storage.getRentRecords());
    return newRecord;
  };

  const markRentPaidOffline = (
    barber: Barber,
    method: 'cash' | 'zelle' | 'manual',
    notes?: string
  ): RentPaymentRecord => {
    const baseAmount = barber.weeklyRent || config.defaultWeeklyRent || 200;
    const newRecord = storage.recordRentPayment({
      barberId: barber.id,
      barberName: barber.name,
      stationNumber: barber.stationNumber,
      amount: baseAmount,
      processingFee: 0,
      totalPaid: baseAmount,
      feeCoveredByBarber: false,
      periodDescription: `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      dueDate: new Date().toISOString().split('T')[0],
      paidAt: new Date().toISOString(),
      status: 'paid',
      paymentMethod: method,
      notes: notes || `Recorded by Shop Owner via ${method.toUpperCase()}`
    });

    setRentRecords(storage.getRentRecords());
    return newRecord;
  };

  const updateRentStatus = (recordId: string, status: RentPaymentRecord['status'], method?: RentPaymentRecord['paymentMethod'], notes?: string) => {
    storage.updateRentRecordStatus(recordId, status, method, notes);
    setRentRecords(storage.getRentRecords());
  };

  return {
    barbers,
    config,
    checkIns,
    rentRecords,
    isCloudConnected,
    addCheckIn,
    updateStatus,
    saveBarbers,
    saveConfig,
    payBoothRent,
    markRentPaidOffline,
    updateRentStatus
  };
}
