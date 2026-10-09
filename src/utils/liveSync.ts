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

/**
 * Universal Multi-Tenant Live System Hook
 * Every barbershop is an independent tenant with 100% isolated data (check-ins, barbers, config, rent).
 * All fleet updates sync seamlessly in real-time across devices via Convex Cloud and BroadcastChannel.
 */
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

  // Reload / refresh active shop data from local store
  const refreshActiveShopData = useCallback(() => {
    const currentShop = storage.getActiveShop();
    setActiveShop(currentShop);
    setBarbers(currentShop.barbers || []);
    setConfig(currentShop.config || storage.getConfig());
    setCheckIns(currentShop.checkIns || []);
    setRentRecords(currentShop.rentRecords || []);
    setShops(storage.getShops());
  }, []);

  // Sync multi-tenant fleet state to Convex Cloud across all physical devices
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

  useEffect(() => {
    // Initial load
    refreshActiveShopData();

    let unsubscribeConfig = () => {};

    // 1. Live Convex Cloud sync for multi-tenant fleet & support messages
    if (convexClient) {
      try {
        const applyCloudConfig = (cloudConfig: any) => {
          if (!cloudConfig) return;

          // 1. Sync full multi-tenant fleet across all devices
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
                setRentRecords(cur.rentRecords || []);

                // Update active shop check-ins and trigger real-time arrival notifications
                const currentShopCheckIns = cur.checkIns || [];
                setCheckIns(currentShopCheckIns);

                if (isInitialCheckInsLoadRef.current) {
                  currentShopCheckIns.forEach(c => knownCheckInIdsRef.current.add(c.id));
                  isInitialCheckInsLoadRef.current = false;
                } else {
                  currentShopCheckIns.forEach(c => {
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
              }
            } catch (e) {
              console.warn('Convex shopsJson parse error:', e);
            }
          } else {
            // Seed Convex cloud with initial local fleet
            syncToConvexCloud(storage.getShops());
          }

          // 2. Sync theme across all devices
          if (cloudConfig.themeId) {
            applyTheme(cloudConfig.themeId as ThemeId);
            const active = storage.getActiveShop();
            if (active && active.themeId !== cloudConfig.themeId) {
              storage.updateShop(active.slug, { themeId: cloudConfig.themeId as ThemeId });
            }
          }

          // 3. Sync support messages across all physical devices
          if (cloudConfig.supportMessagesJson) {
            try {
              const cloudMessages: SupportMessage[] = JSON.parse(cloudConfig.supportMessagesJson);
              if (Array.isArray(cloudMessages)) {
                const local = storage.getSupportMessages();
                const map = new Map<string, SupportMessage>();
                local.forEach(m => map.set(m.id, m));
                cloudMessages.forEach(m => {
                  const existing = map.get(m.id);
                  if (existing) {
                    map.set(m.id, {
                      ...m,
                      readByHq: m.readByHq || existing.readByHq,
                      readByShop: m.readByShop || existing.readByShop
                    });
                  } else {
                    map.set(m.id, m);
                  }
                });
                const merged = Array.from(map.values()).sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                localStorage.setItem('walkin_support_messages_v1', JSON.stringify(merged));
                setSupportMessages(merged);
              }
            } catch (e) {
              console.warn('Convex support messages parse error:', e);
            }
          } else {
            const local = storage.getSupportMessages();
            if (local.length > 0 && convexClient) {
              convexClient.mutation(api.config.update, {
                supportMessagesJson: JSON.stringify(local)
              }).catch(() => {});
            }
          }
        };

        // Instant Direct Fetch on Mount
        convexClient.query(api.config.get, {}).then(applyCloudConfig).catch(() => {});

        // Watch config & fleet state for real-time live updates
        const configWatch = convexClient.watchQuery(api.config.get, {});
        unsubscribeConfig = configWatch.onUpdate(() => {
          applyCloudConfig(configWatch.localQueryResult());
        });
        applyCloudConfig(configWatch.localQueryResult());

        setIsCloudConnected(true);
      } catch (err) {
        console.warn('Convex connection setup:', err);
      }
    }

    // 2. Local Fallback Events & Multi-Shop Events
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

    // 3. Cross-Tab Real-time BroadcastChannel Sync
    let crossTabChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        crossTabChannel = new BroadcastChannel('of_system_sync_broadcast_v1');
        crossTabChannel.onmessage = (event) => {
          const { eventType, detail } = event.data || {};
          if (eventType === 'support_messages_updated') {
            handleSupportUpdate();
          } else if (eventType === 'shops_updated') {
            handleShopsUpdate();
          } else if (eventType === 'shop_switched') {
            handleShopSwitched({ detail });
          } else if (eventType === 'barbers_updated') {
            handleBarbersUpdate();
          } else if (eventType === 'checkins_updated') {
            handleCheckInsUpdate();
          } else if (eventType === 'rent_updated') {
            handleRentUpdate();
          } else if (eventType === 'config_updated') {
            handleConfigUpdate();
          }
        };
      } catch (e) {
        console.warn('Cross-tab sync channel warning:', e);
      }
    }

    // 4. Native Storage Event for other tabs/windows
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.includes('support_messages')) {
        handleSupportUpdate();
      } else if (e.key?.includes('shops')) {
        handleShopsUpdate();
      } else if (e.key?.includes('active_shop')) {
        handleShopSwitched({ detail: { slug: storage.getActiveShopSlug() } });
      }
    };
    window.addEventListener('storage', handleStorageEvent);

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

    // 5. Reconnect & Refresh on Mobile Screen Unlock / Tab Switch Focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshActiveShopData();
        if (convexClient) {
          convexClient.query(api.config.get, {}).then((cloudConfig: any) => {
            if (cloudConfig?.shopsJson) {
              const cloudShops: Shop[] = JSON.parse(cloudConfig.shopsJson);
              if (Array.isArray(cloudShops)) {
                storage.saveShops(cloudShops);
                setShops(cloudShops);
                refreshActiveShopData();
              }
            }
          }).catch(() => {});
        }
      }
    };
    const handleWindowFocus = () => {
      refreshActiveShopData();
      if (convexClient) {
        convexClient.query(api.config.get, {}).then((cloudConfig: any) => {
          if (cloudConfig?.shopsJson) {
            const cloudShops: Shop[] = JSON.parse(cloudConfig.shopsJson);
            if (Array.isArray(cloudShops)) {
              storage.saveShops(cloudShops);
              setShops(cloudShops);
              refreshActiveShopData();
            }
          }
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // 6. Periodic safety heartbeat to keep active shop state updated
    const heartbeatInterval = setInterval(() => {
      const current = storage.getCheckIns();
      if (current) {
        setCheckIns(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(current)) {
            return current;
          }
          return prev;
        });
      }
    }, 4000);

    return () => {
      unsubscribeConfig();
      window.removeEventListener('barbers_updated', handleBarbersUpdate);
      window.removeEventListener('config_updated', handleConfigUpdate);
      window.removeEventListener('checkins_updated', handleCheckInsUpdate);
      window.removeEventListener('rent_updated', handleRentUpdate);
      window.removeEventListener('shops_updated', handleShopsUpdate);
      window.removeEventListener('shop_switched', handleShopSwitched);
      window.removeEventListener('support_messages_updated', handleSupportUpdate);
      window.removeEventListener('storage', handleStorageEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(heartbeatInterval);
      if (crossTabChannel) {
        crossTabChannel.close();
      }
    };
  }, [refreshActiveShopData]);

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

  // Actions: Client Check-in (Strictly scoped to active shop)
  const addCheckIn = async (
    clientName: string, 
    selectedBarber?: Barber, 
    appointmentTime: string = 'Walk-In',
    type: CheckInRecord['type'] = 'appointment',
    clientPhone?: string
  ) => {
    const isFirstAvailable = !selectedBarber || selectedBarber.id === 'first_available';
    const isWalkIn = type === 'walkin' || isFirstAvailable;
    const barberId = isFirstAvailable ? 'first_available' : selectedBarber?.id;
    const barberName = isFirstAvailable ? 'First Available' : selectedBarber?.name;
    const resolvedType = isWalkIn ? 'walkin' : type;

    // 1. Immediately create local record in active shop's storage
    const localRecord = storage.addCheckIn({
      clientName,
      clientPhone: clientPhone?.trim() || undefined,
      type: resolvedType,
      barberId,
      barberName,
      appointmentTime
    });

    // 2. Immediately update local React state for instantaneous UI response
    setCheckIns(prev => [localRecord, ...prev.filter(c => c.id !== localRecord.id)]);

    // 3. Sync full fleet state to Convex Cloud across all devices
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);

    // 4. Trigger phone buzz & push alert
    notificationManager.sendBarberArrivalAlert(
      clientName, 
      isFirstAvailable ? 'All Barbers (Walk-In)' : (selectedBarber ? selectedBarber.name : 'All Barbers (Walk-In)'), 
      appointmentTime, 
      barberId
    );

    return localRecord;
  };

  // Actions: Update Check-in Status (Strictly scoped to active shop)
  const updateStatus = async (
    id: string, 
    status: CheckInRecord['status'],
    _barberId?: string,
    _barberName?: string
  ) => {
    // 1. Update active shop's localStorage & broadcast
    storage.updateCheckInStatus(id, status);

    // 2. Immediately update local React state
    setCheckIns(prev => prev.map(c => 
      c.id === id ? { ...c, status, statusUpdatedAt: new Date().toISOString() } : c
    ));

    // 3. Sync updated fleet to Convex Cloud
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Claim Walk-In (Strictly scoped to active shop)
  const claimCheckIn = async (
    checkInId: string, 
    barber: Barber, 
    newStatus: CheckInRecord['status'] = 'waiting'
  ) => {
    // 1. Update active shop's storage & broadcast
    storage.claimCheckIn(checkInId, barber.id, barber.name, newStatus);

    // 2. Immediately update local React state
    setCheckIns(prev => prev.map(c => 
      c.id === checkInId 
        ? { ...c, barberId: barber.id, barberName: barber.name, status: newStatus, notes: 'claimed' } 
        : c
    ));

    // 3. Sync updated fleet to Convex Cloud
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Release a claimed walk-in back to the shared walk-in line (keeps original spot)
  const releaseCheckIn = async (checkInId: string) => {
    storage.releaseCheckIn(checkInId);

    setCheckIns(prev => prev.map(c => 
      c.id === checkInId 
        ? { ...c, barberId: 'first_available', barberName: 'First Available', status: 'waiting', notes: undefined, statusUpdatedAt: new Date().toISOString() } 
        : c
    ));

    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Delete Check-In Record (Strictly scoped to active shop)
  const deleteCheckIn = async (checkInId: string) => {
    storage.deleteCheckIn(checkInId);
    setCheckIns(prev => prev.filter(c => c.id !== checkInId));
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Restore Check-In Record (Undo deletion)
  const restoreCheckIn = async (record: CheckInRecord) => {
    storage.restoreCheckIn(record);
    setCheckIns(prev => {
      if (prev.some(c => c.id === record.id)) return prev;
      return [record, ...prev];
    });
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Save Barbers (Strictly scoped to active shop)
  const saveBarbers = async (updated: Barber[]) => {
    storage.saveBarbers(updated);
    setBarbers(updated);
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Save Config (Strictly scoped to active shop)
  const saveConfig = async (updated: ShopConfig) => {
    storage.saveConfig(updated);
    setConfig(updated);
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

  // Actions: Booth Rent Payment (Strictly scoped to active shop)
  const payBoothRent = async (
    barber: Barber,
    method: RentPaymentRecord['paymentMethod'] = 'apple_pay',
    feeCovered: boolean = true,
    weeksCovered: number = 1,
    customAmount?: number
  ): Promise<RentPaymentRecord> => {
    const weeklyRate = barber.weeklyRent || config.defaultWeeklyRent || 200;
    const baseAmount = customAmount !== undefined ? customAmount : weeklyRate * weeksCovered;
    const isZeroFeeMethod = method === 'manual';
    const fee = isZeroFeeMethod ? 0 : (feeCovered ? Number(((baseAmount * 0.029) + 0.30).toFixed(2)) : 0);
    const total = baseAmount + fee;

    const periodDesc = weeksCovered > 1
      ? `${weeksCovered} Weeks Rent (${weeksCovered} cycles caught up)`
      : `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const newRecord = storage.recordRentPayment({
      barberId: barber.id,
      barberName: barber.name,
      stationNumber: barber.stationNumber,
      amount: baseAmount,
      processingFee: fee,
      totalPaid: total,
      feeCoveredByBarber: feeCovered,
      periodDescription: periodDesc,
      dueDate: new Date().toISOString().split('T')[0],
      paidAt: new Date().toISOString(),
      status: 'paid',
      paymentMethod: method,
      notes: `Paid via ${method === 'apple_pay' ? 'Apple Pay' : method === 'card' ? 'Card' : method === 'stripe' ? 'Stripe' : 'Manual Override'} (${weeksCovered} wk${weeksCovered > 1 ? 's' : ''})`,
      weeksCovered
    });

    // Update the barber's weeksOwed in storage and state
    const currentOwed = typeof barber.weeksOwed === 'number' ? barber.weeksOwed : 1;
    const remainingWeeks = Math.max(0, currentOwed - weeksCovered);
    const currentBarbers = storage.getBarbers();
    const updatedBarbers = currentBarbers.map(b => b.id === barber.id ? { ...b, weeksOwed: remainingWeeks } : b);
    storage.saveBarbers(updatedBarbers);
    setBarbers(updatedBarbers);

    setRentRecords(storage.getRentRecords());
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
    return newRecord;
  };

  const markRentPaidOffline = (
    barber: Barber,
    method: RentPaymentRecord['paymentMethod'] = 'manual',
    notes?: string,
    paidAmount?: number,
    weeksCovered: number = 1
  ): RentPaymentRecord => {
    const weeklyRate = barber.weeklyRent || config.defaultWeeklyRent || 200;
    const baseAmount = paidAmount !== undefined ? paidAmount : weeklyRate * weeksCovered;

    const periodDesc = weeksCovered > 1
      ? `${weeksCovered} Weeks Rent (${weeksCovered} cycles caught up)`
      : `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const newRecord = storage.recordRentPayment({
      barberId: barber.id,
      barberName: barber.name,
      stationNumber: barber.stationNumber,
      amount: baseAmount,
      processingFee: 0,
      totalPaid: baseAmount,
      feeCoveredByBarber: false,
      periodDescription: periodDesc,
      dueDate: new Date().toISOString().split('T')[0],
      paidAt: new Date().toISOString(),
      status: 'paid',
      paymentMethod: method,
      notes: notes || `Recorded by Shop Owner via ${method?.toUpperCase() || 'MANUAL OVERRIDE'} (${weeksCovered} wk${weeksCovered > 1 ? 's' : ''})`,
      weeksCovered
    });

    // Update the barber's weeksOwed in storage and state
    const currentOwed = typeof barber.weeksOwed === 'number' ? barber.weeksOwed : 1;
    const remainingWeeks = Math.max(0, currentOwed - weeksCovered);
    const currentBarbers = storage.getBarbers();
    const updatedBarbers = currentBarbers.map(b => b.id === barber.id ? { ...b, weeksOwed: remainingWeeks } : b);
    storage.saveBarbers(updatedBarbers);
    setBarbers(updatedBarbers);

    setRentRecords(storage.getRentRecords());
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
    return newRecord;
  };

  const updateRentStatus = (recordId: string, status: RentPaymentRecord['status'], method?: RentPaymentRecord['paymentMethod'], notes?: string) => {
    storage.updateRentRecordStatus(recordId, status, method, notes);
    setRentRecords(storage.getRentRecords());
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
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

  // Helper: Sync Support Messages to Convex Cloud for real-time multi-device sync
  const syncSupportMessagesToConvexCloud = async (customMessages?: SupportMessage[]) => {
    if (!convexClient) return;
    try {
      const all = customMessages || storage.getSupportMessages();
      await convexClient.mutation(api.config.update, {
        supportMessagesJson: JSON.stringify(all)
      });
    } catch (err) {
      console.warn('Convex support messages sync error:', err);
    }
  };

  const sendSupportMessage = useCallback((
    shopSlug: string,
    text: string,
    sender: 'shop_owner' | 'platform_hq',
    senderName?: string
  ): SupportMessage => {
    const msg = storage.sendSupportMessage(shopSlug, text, sender, senderName);
    const updated = storage.getSupportMessages();
    setSupportMessages(updated);
    syncSupportMessagesToConvexCloud(updated);
    return msg;
  }, []);

  const markSupportMessagesRead = useCallback((shopSlug: string, reader: 'hq' | 'shop') => {
    storage.markSupportMessagesRead(shopSlug, reader);
    const updated = storage.getSupportMessages();
    setSupportMessages(updated);
    syncSupportMessagesToConvexCloud(updated);
  }, []);

  const markShopSubscriptionPaid = useCallback((slug: string, paymentMethod: SubscriptionPaymentMethod = 'stripe') => {
    storage.markShopSubscriptionPaid(slug, paymentMethod);
    const updatedFleet = storage.getShops();
    setShops(updatedFleet);
    syncToConvexCloud(updatedFleet);
  }, []);

  const clearCompletedCheckIns = async () => {
    storage.clearCompletedCheckIns();
    setCheckIns(prev => prev.filter(r => r.status !== 'completed'));
    const currentFleet = storage.getShops();
    setShops(currentFleet);
    syncToConvexCloud(currentFleet);
  };

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
    claimCheckIn,
    releaseCheckIn,
    deleteCheckIn,
    restoreCheckIn,
    clearCompletedCheckIns,
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
