import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../convex/_generated/api';
import type { 
  Barber, 
  CheckInRecord, 
  ShopConfig, 
  RentPaymentRecord, 
  Shop, 
  SupportMessage, 
  SubscriptionPaymentMethod 
} from '../types';
import { storage } from './storage';
import { notificationManager } from './notifications';
import { convexClient } from './convexClient';
import { applyTheme, type ThemeId } from './themes';
import { updatePwaBranding } from './pwaBranding';

export { convexClient };

export function useLiveSystem() {
  const [activeShopSlug, setActiveShopSlugState] = useState<string>(() => storage.getActiveShopSlug());
  const [shops, setShops] = useState<Shop[]>(() => storage.getShops());
  const [activeShop, setActiveShop] = useState<Shop>(() => storage.getActiveShop());

  const [barbers, setBarbers] = useState<Barber[]>(() => storage.getBarbers());
  const [config, setConfig] = useState<ShopConfig>(() => storage.getConfig());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => storage.getCheckIns());
  const [rentRecords, setRentRecords] = useState<RentPaymentRecord[]>(() => storage.getRentRecords());
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() => storage.getSupportMessages());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(!!convexClient);

  const knownCheckInIdsRef = useRef<Set<string>>(new Set());
  const isInitialCheckInsLoadRef = useRef<boolean>(true);

  // Apply active shop's theme and dynamic PWA app icon whenever active shop changes
  useEffect(() => {
    const current = storage.getActiveShop();
    setActiveShop(current);
    if (current) {
      if (current.themeId) {
        applyTheme(current.themeId);
      }
      updatePwaBranding(current);
    }
  }, [activeShopSlug, shops]);

  // Handle reload / refresh of active shop data
  const refreshActiveShopData = useCallback(() => {
    const currentShop = storage.getActiveShop();
    setActiveShop(currentShop);
    setBarbers(currentShop.barbers || []);
    setConfig(currentShop.config || storage.getConfig());
    setCheckIns(currentShop.checkIns || []);
    setRentRecords(currentShop.rentRecords || []);
    setShops(storage.getShops());
  }, []);

  useEffect(() => {
    // Initial sync
    refreshActiveShopData();

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
              autoPayEnabled: b.autoPayEnabled ?? false,
              passcode: b.passcode || '1111'
            }));
            setBarbers(mapped);
            storage.saveBarbers(mapped);
          } else if (Array.isArray(cloudBarbers) && cloudBarbers.length === 0 && convexClient) {
            convexClient.mutation(api.barbers.seed, {}).catch(() => {});
          }
        });

        // Watch config & multi-tenant fleet state
        const configWatch = convexClient.watchQuery(api.config.get, {});
        const unsubscribeConfig = configWatch.onUpdate(() => {
          const cloudConfig = configWatch.localQueryResult() as any;
          if (cloudConfig) {
            const merged = { ...storage.getConfig(), ...cloudConfig };
            setConfig(merged);
            storage.saveConfig(merged);

            // 1. Sync full multi-tenant fleet from Convex Cloud across all devices
            if (cloudConfig.shopsJson) {
              try {
                const cloudShops: Shop[] = JSON.parse(cloudConfig.shopsJson);
                if (Array.isArray(cloudShops) && cloudShops.length > 0) {
                  storage.saveShops(cloudShops);
                  setShops(cloudShops);
                  const cur = storage.getActiveShop();
                  setActiveShop(cur);
                  setBarbers(cur.barbers || []);
                  setConfig(cur.config || storage.getConfig());
                  setCheckIns(cur.checkIns || []);
                  setRentRecords(cur.rentRecords || []);
                }
              } catch (e) {
                console.warn('Convex shopsJson parse error:', e);
              }
            }

            // 2. Sync theme across all devices in real-time
            if (cloudConfig.themeId) {
              applyTheme(cloudConfig.themeId as ThemeId);
              const active = storage.getActiveShop();
              if (active && active.themeId !== cloudConfig.themeId) {
                storage.updateShop(active.slug, { themeId: cloudConfig.themeId as ThemeId });
              }
            }
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

    // 2. Local fallback events & multi-shop events
    const handleBarbersUpdate = () => setBarbers(storage.getBarbers());
    const handleConfigUpdate = () => setConfig(storage.getConfig());
    const handleCheckInsUpdate = () => setCheckIns(storage.getCheckIns());
    const handleRentUpdate = () => setRentRecords(storage.getRentRecords());
    const handleShopsUpdate = () => {
      setShops(storage.getShops());
      refreshActiveShopData();
    };
    const handleShopSwitched = (e: any) => {
      const slug = e?.detail?.slug || storage.getActiveShopSlug();
      setActiveShopSlugState(slug);
      refreshActiveShopData();
    };

    const handleSupportUpdate = () => {
      setSupportMessages(storage.getSupportMessages());
    };

    window.addEventListener('barbers_updated', handleBarbersUpdate);
    window.addEventListener('config_updated', handleConfigUpdate);
    window.addEventListener('checkins_updated', handleCheckInsUpdate);
    window.addEventListener('rent_updated', handleRentUpdate);
    window.addEventListener('shops_updated', handleShopsUpdate);
    window.addEventListener('shop_switched', handleShopSwitched);
    window.addEventListener('support_messages_updated', handleSupportUpdate);

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
      window.removeEventListener('shops_updated', handleShopsUpdate);
      window.removeEventListener('shop_switched', handleShopSwitched);
      window.removeEventListener('support_messages_updated', handleSupportUpdate);
    };
  }, [refreshActiveShopData]);

  // Helper: Sync multi-tenant state & themes to Convex Cloud
  const syncToConvexCloud = async (customShops?: Shop[]) => {
    if (!convexClient) return;
    try {
      const all = customShops || storage.getShops();
      const active = storage.getActiveShop();
      await convexClient.mutation(api.config.update, {
        shopsJson: JSON.stringify(all),
        themeId: active?.themeId,
        logoUrl: active?.logoUrl,
        shopName: active?.name || active?.config?.shopName
      });
    } catch (err) {
      console.warn('Convex cloud sync error:', err);
    }
  };

  // Actions: Switch Active Barbershop
  const switchShop = (slug: string) => {
    storage.setActiveShopSlug(slug);
    setActiveShopSlugState(slug);
    refreshActiveShopData();
  };

  // Actions: Create New Barbershop
  const createShop = (shopData: Partial<Shop> & { name: string; slug: string; themeId: ThemeId }): Shop => {
    const newShop = storage.createShop(shopData);
    const updated = storage.getShops();
    setShops(updated);
    syncToConvexCloud(updated);
    return newShop;
  };

  // Actions: Update Shop Branding or Config
  const updateShop = (slug: string, updates: Partial<Shop>): Shop => {
    const updatedShop = storage.updateShop(slug, updates);
    const updatedFleet = storage.getShops();
    setShops(updatedFleet);
    if (activeShopSlug === slug) {
      refreshActiveShopData();
      if (updates.themeId) {
        applyTheme(updates.themeId);
      }
    }
    syncToConvexCloud(updatedFleet);
    return updatedShop;
  };

  // Actions: Delete Shop
  const deleteShop = (slug: string) => {
    storage.deleteShop(slug);
    const updatedFleet = storage.getShops();
    setShops(updatedFleet);
    if (activeShopSlug === slug) {
      switchShop('of');
    }
    syncToConvexCloud(updatedFleet);
  };

  // Actions: Client Check-in
  const addCheckIn = async (
    clientName: string, 
    selectedBarber?: Barber, 
    appointmentTime: string = 'Scheduled',
    type: CheckInRecord['type'] = 'appointment'
  ) => {
    const barberId = selectedBarber?.id;
    const barberName = selectedBarber?.name || 'Brandon';

    // Push to Convex Cloud if active
    if (convexClient) {
      try {
        await convexClient.mutation(api.checkins.add, {
          clientName,
          type,
          barberId,
          barberName,
          appointmentTime
        });
      } catch {
        storage.addCheckIn({
          clientName,
          type,
          barberId,
          barberName,
          appointmentTime
        });
      }
    } else {
      storage.addCheckIn({
        clientName,
        type,
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
      type,
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

  const factoryReset = () => {
    storage.factoryResetPlatform();
    const updated = storage.getShops();
    setShops(updated);
    setActiveShopSlugState('of');
    refreshActiveShopData();
    syncToConvexCloud(updated);
  };

  const loadDemoFleet = () => {
    storage.loadDemoFleet();
    const updated = storage.getShops();
    setShops(updated);
    setActiveShopSlugState('of');
    refreshActiveShopData();
    syncToConvexCloud(updated);
  };

  const sendSupportMessage = useCallback((
    shopSlug: string,
    text: string,
    sender: 'shop_owner' | 'platform_hq',
    senderName?: string
  ): SupportMessage => {
    const msg = storage.sendSupportMessage(shopSlug, text, sender, senderName);
    setSupportMessages(storage.getSupportMessages());
    return msg;
  }, []);

  const markSupportMessagesRead = useCallback((shopSlug: string, reader: 'hq' | 'shop') => {
    storage.markSupportMessagesRead(shopSlug, reader);
    setSupportMessages(storage.getSupportMessages());
  }, []);

  const markShopSubscriptionPaid = useCallback((slug: string, paymentMethod: SubscriptionPaymentMethod = 'zelle') => {
    storage.markShopSubscriptionPaid(slug, paymentMethod);
    const updatedFleet = storage.getShops();
    setShops(updatedFleet);
    syncToConvexCloud(updatedFleet);
  }, []);

  return {
    activeShopSlug,
    activeShop,
    shops,
    barbers,
    config,
    checkIns,
    rentRecords,
    supportMessages,
    isCloudConnected,
    switchShop,
    createShop,
    updateShop,
    deleteShop,
    factoryReset,
    loadDemoFleet,
    addCheckIn,
    updateStatus,
    saveBarbers,
    saveConfig,
    payBoothRent,
    markRentPaidOffline,
    updateRentStatus,
    sendSupportMessage,
    markSupportMessagesRead,
    markShopSubscriptionPaid,
    refreshActiveShopData
  };
}
