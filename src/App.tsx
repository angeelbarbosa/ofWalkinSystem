import { useState, useEffect, useCallback } from 'react';
import { Lock, ArrowLeft, Scissors, Shield } from 'lucide-react';
import type { Barber, CheckInRecord, MainNavTab } from './types';
import { useLiveSystem } from './utils/liveSync';
import { notificationManager } from './utils/notifications';
import { updatePwaBranding } from './utils/pwaBranding';

import { KioskHome } from './components/Kiosk/KioskHome';
import { ShoppingScreen } from './components/Kiosk/ShoppingScreen';
import { BarberSelect } from './components/Kiosk/BarberSelect';
import { LiveQueueBoard } from './components/Kiosk/LiveQueueBoard';
import { ClientCheckInModal } from './components/Kiosk/ClientCheckInModal';
import { ConfirmationScreen } from './components/Kiosk/ConfirmationScreen';
import { BarberLoginScreen } from './components/BarberPortal/BarberLoginScreen';
import { BarberDashboard } from './components/BarberPortal/BarberDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { PinModal } from './components/Admin/PinModal';
import { SuperAdminDashboard } from './components/SuperAdmin/SuperAdminDashboard';
import { ShopSwitcherBar } from './components/Shared/ShopSwitcherBar';
import { RootLandingScreen } from './components/Landing/RootLandingScreen';
import { SupportChatDrawer } from './components/Shared/SupportChatDrawer';

import './App.css';

export function App() {
  // Check URL query parameters, pathname, and standalone PWA launcher state
  const getInitialTab = (): MainNavTab => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname === '/hq' || pathname.startsWith('/hq/') || pathname === '/super_admin') return 'super_admin';
      if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
      if (pathname === '/barber' || pathname.startsWith('/barber/')) return 'barber_portal';

      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');
      const shopParam = params.get('shop');

      if (portal === 'super_admin' || portal === 'superadmin' || portal === 'hq') return 'super_admin';
      if (portal === 'barber' || portal === 'barber_portal') return 'barber_portal';
      if (portal === 'admin') return 'admin';
      if (shopParam) return 'kiosk';

      // Check if standalone PWA mode was launched from an icon
      const isStandalone = (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('ios-app://')
      );
      const savedPortal = localStorage.getItem('walkin_pwa_portal');
      if (isStandalone && savedPortal === 'super_admin') {
        return 'super_admin';
      }
      if (isStandalone && savedPortal && savedPortal !== 'landing') {
        return savedPortal as MainNavTab;
      }
    }
    // Naked root URL shows the Minimal Brand Gate with Shop Finder
    return 'landing';
  };

  // Navigation State
  const [currentTab, setCurrentTab] = useState<MainNavTab>(getInitialTab);
  const [kioskStep, setKioskStep] = useState<'home' | 'shopping_browsing' | 'shopping_checkout' | 'barber_select' | 'live_queue' | 'confirmed'>('home');
  const [checkInMode, setCheckInMode] = useState<'appointment' | 'walkin'>('appointment');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [latestConfirmedRecord, setLatestConfirmedRecord] = useState<CheckInRecord | null>(null);

  // Barber Hub Authentication State
  const [authenticatedBarber, setAuthenticatedBarber] = useState<Barber | null>(null);

  // Security / Admin kiosk lock
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetTabAfterUnlock, setTargetTabAfterUnlock] = useState<MainNavTab>('barber_portal');

  // Global In-App Support Chat Drawer State (Accessible from Kiosk, Barber Hub, Admin, or Live Toast)
  const [isGlobalSupportChatOpen, setIsGlobalSupportChatOpen] = useState(false);

  // Real-time Cloud + Multi-Shop Live System
  const {
    activeShopSlug,
    activeShop,
    shops,
    barbers,
    config,
    checkIns,
    rentRecords,
    supportMessages,
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
    sendSupportMessage,
    markSupportMessagesRead,
    markShopSubscriptionPaid
  } = useLiveSystem();

  // Keep URL query parameter and localStorage in sync with active portal
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save active portal for standalone PWA icon launch
    localStorage.setItem('walkin_pwa_portal', currentTab);

    // Update browser URL without reloading
    const currentUrl = new URL(window.location.href);
    if (currentTab === 'landing') {
      currentUrl.searchParams.delete('portal');
      currentUrl.searchParams.delete('shop');
    } else if (currentTab === 'super_admin') {
      currentUrl.searchParams.set('portal', 'super_admin');
      currentUrl.searchParams.delete('shop');
    } else if (currentTab === 'admin') {
      currentUrl.searchParams.set('portal', 'admin');
      if (activeShopSlug) currentUrl.searchParams.set('shop', activeShopSlug);
    } else if (currentTab === 'barber_portal') {
      currentUrl.searchParams.set('portal', 'barber');
      if (activeShopSlug) currentUrl.searchParams.set('shop', activeShopSlug);
    } else if (currentTab === 'kiosk') {
      currentUrl.searchParams.delete('portal');
      if (activeShopSlug) currentUrl.searchParams.set('shop', activeShopSlug);
    }
    window.history.replaceState({}, '', currentUrl.toString());
  }, [currentTab, activeShopSlug]);

  // Reset auth when switching shops
  useEffect(() => {
    setAuthenticatedBarber(null);
  }, [activeShopSlug]);

  // Keep PWA bookmark title, Apple Touch icon, and start_url dynamically synced with current tab
  useEffect(() => {
    if (activeShop) {
      updatePwaBranding(activeShop, currentTab);
    }
  }, [activeShop, currentTab]);

  // Handle new Client Check-in from Kiosk
  const handleCheckInSubmit = async (
    clientName: string, 
    appointmentTime: string, 
    checkInType: 'appointment' | 'walkin' = 'appointment'
  ) => {
    if (!selectedBarber) return;

    const record = await addCheckIn(clientName, selectedBarber, appointmentTime, checkInType);

    setLatestConfirmedRecord(record);
    setIsCheckInModalOpen(false);
    setKioskStep('confirmed');
  };

  // Handle Shopper Ready to Checkout at Register
  const handleShoppingCheckout = async () => {
    // 1. Alert staff & barbers immediately via push & sound & vibration
    notificationManager.sendBarberArrivalAlert('Store Shopper', 'Register / Counter', 'Ready to Checkout');

    // 2. Add check-in record so staff can see on their dashboard
    const shopBarber: Barber = {
      id: 'store_counter',
      name: 'Front Register',
      specialty: 'Supply Store Checkout',
      avatar: 'store',
      avatarColor: '#09090B',
      phone: '',
      stationNumber: 0,
      isWorking: true
    };
    await addCheckIn('Store Shopper', shopBarber, 'Ready to Checkout', 'shopping');

    // 3. Display confirmation screen
    setKioskStep('shopping_checkout');
  };

  const handleResetKiosk = () => {
    setKioskStep('home');
    setSelectedBarber(null);
    setIsCheckInModalOpen(false);
    setLatestConfirmedRecord(null);
    setCheckInMode('appointment');
  };

  const handleOpenStaffModal = (tab: MainNavTab) => {
    setTargetTabAfterUnlock(tab);
    setShowPinModal(true);
  };

  const handleSendSupportMessage = useCallback((text: string) => {
    if (activeShop) {
      sendSupportMessage(
        activeShop.slug, 
        text, 
        'shop_owner', 
        `${activeShop.ownerContactName || 'Owner'} (${activeShop.name})`
      );
    }
  }, [activeShop, sendSupportMessage]);

  const handleMarkSupportRead = useCallback(() => {
    if (activeShop) {
      markSupportMessagesRead(activeShop.slug, 'shop');
    }
  }, [activeShop, markSupportMessagesRead]);

  // Real-time unread messages from Platform HQ for the active shop
  const activeShopCleanSlug = (activeShop?.slug || 'of').toLowerCase().trim();
  const unreadHqMessages = supportMessages.filter(
    m => (m.shopSlug || '').toLowerCase().trim() === activeShopCleanSlug &&
         !m.readByShop &&
         m.sender === 'platform_hq'
  );
  const latestUnreadHqMsg = unreadHqMessages[unreadHqMessages.length - 1];

  return (
    <div className="app-container">
      {/* Live Incoming Support Message Floating Toast (Visible on Kiosk / Barber Hub / Admin) */}
      {latestUnreadHqMsg && !isGlobalSupportChatOpen && currentTab !== 'super_admin' && (
        <div 
          className="slide-up"
          style={{
            position: 'fixed',
            top: 'max(14px, env(safe-area-inset-top, 14px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99990,
            maxWidth: '92%',
            width: '420px',
            background: 'rgba(20, 20, 24, 0.94)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '18px',
            padding: '10px 14px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            cursor: 'pointer',
            boxSizing: 'border-box'
          }}
          onClick={() => setIsGlobalSupportChatOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'var(--accent-primary)',
              color: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Shield size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 850, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Platform HQ Message</span>
                <span style={{ fontSize: '9px', background: 'var(--pastel-red)', color: '#fff', padding: '1px 5px', borderRadius: '9999px', fontWeight: 900 }}>New</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {latestUnreadHqMsg.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'var(--accent-primary)',
              color: 'var(--bg-main)',
              fontSize: '11px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            Reply
          </button>
        </div>
      )}

      <div 
        className="content-wrapper" 
        style={{ 
          padding: (currentTab === 'super_admin' || currentTab === 'landing') ? 0 : currentTab === 'kiosk' ? 'max(24px, env(safe-area-inset-top, 24px)) 16px 20px' : 'max(16px, env(safe-area-inset-top, 16px)) 16px 20px' 
        }}
      >
        
        {/* ROOT LANDING SCREEN (When visiting naked domain without direct shop link) */}
        {currentTab === 'landing' ? (
          <RootLandingScreen
            shops={shops}
            onSelectShop={(slug, targetPortal = 'kiosk') => {
              switchShop(slug);
              setCurrentTab(targetPortal);
              if (targetPortal === 'kiosk') {
                handleResetKiosk();
              }
            }}
            onOpenSuperAdmin={() => setCurrentTab('super_admin')}
          />
        ) : currentTab === 'super_admin' ? (
          <SuperAdminDashboard
            shops={shops}
            activeShopSlug={activeShopSlug}
            supportMessages={supportMessages}
            onSwitchShop={switchShop}
            onCreateShop={createShop}
            onUpdateShop={updateShop}
            onDeleteShop={deleteShop}
            onFactoryReset={factoryReset}
            onLoadDemoFleet={loadDemoFleet}
            onNavigateTab={setCurrentTab}
            onSendSupportMessage={sendSupportMessage}
            onMarkSupportRead={markSupportMessagesRead}
            onMarkSubscriptionPaid={markShopSubscriptionPaid}
          />
        ) : (
          <>
            {/* STAFF VIEWS HEADER (Only shown when inside Barber Portal or Admin) */}
            {currentTab !== 'kiosk' && (
              <header style={{ width: '100%', maxWidth: '680px', margin: '0 auto 18px' }}>
                {/* Navigation Controls Bar with Shop Identity Badge */}
                <div className="staff-nav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <button
                      onClick={() => {
                        setAuthenticatedBarber(null);
                        setCurrentTab('kiosk');
                        handleResetKiosk();
                      }}
                      className="back-pill-btn"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                      title="Exit to Customer Kiosk"
                    >
                      <ArrowLeft size={15} />
                      <span>Kiosk</span>
                    </button>

                    {/* Isolated Shop Badge (No dropdown or leakage of other shops) */}
                    <ShopSwitcherBar currentShop={activeShop} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentTab === 'barber_portal' && (
                      <div
                        style={{
                          background: 'var(--surface-card, #09090B)',
                          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                          color: 'var(--text-primary, #FFFFFF)',
                          padding: '6px 14px',
                          borderRadius: 9999,
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Scissors size={14} />
                        <span>{authenticatedBarber ? `${authenticatedBarber.name} (#${authenticatedBarber.stationNumber})` : 'Barber Hub'}</span>
                      </div>
                    )}

                    {currentTab === 'admin' && (
                      <div
                        style={{
                          background: 'var(--surface-card, #09090B)',
                          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                          color: 'var(--text-primary, #FFFFFF)',
                          padding: '6px 14px',
                          borderRadius: 9999,
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Lock size={13} />
                        <span>Shop Admin</span>
                      </div>
                    )}
                  </div>
                </div>
              </header>
            )}

            {/* Tab 1: KIOSK FRONT ENTRANCE VIEW (Zero clutter, NO top bar for customers) */}
            {currentTab === 'kiosk' && (
              <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Step 1: Kiosk Home Choice Screen */}
                {kioskStep === 'home' && (
                  <KioskHome
                    config={config}
                    shopSlug={activeShopSlug}
                    barbers={barbers}
                    checkIns={checkIns}
                    onSelectBrowsing={() => setKioskStep('shopping_browsing')}
                    onSelectCheckout={handleShoppingCheckout}
                    onSelectAppointment={() => {
                      setCheckInMode('appointment');
                      setKioskStep('barber_select');
                    }}
                    onJoinWalkInDirect={async (clientName) => {
                      const working = barbers.filter(b => b.isWorking);
                      const freeBarber = working.find(b => !checkIns.some(c => (c.barberId === b.id || c.barberName === b.name) && c.status === 'in_chair')) || working[0] || barbers[0];
                      const record = await addCheckIn(clientName, freeBarber, 'Walk-In', 'walkin');
                      setLatestConfirmedRecord(record);
                      setKioskStep('confirmed');
                    }}
                  />
                )}

                {/* Step 2: Live Walk-In Queue Board */}
                {kioskStep === 'live_queue' && (
                  <LiveQueueBoard
                    config={config}
                    barbers={barbers}
                    checkIns={checkIns}
                    onJoinQueue={async (clientName, preferredBarber) => {
                      const record = await addCheckIn(clientName, preferredBarber, 'Walk-In', 'walkin');
                      setLatestConfirmedRecord(record);
                      setKioskStep('confirmed');
                    }}
                    onBack={handleResetKiosk}
                  />
                )}

                {/* Step 2A: Shopping Browsing Welcome Screen */}
                {kioskStep === 'shopping_browsing' && (
                  <ShoppingScreen
                    config={config}
                    mode="browsing"
                    onBack={handleResetKiosk}
                  />
                )}

                {/* Step 2B: Shopping Checkout Alert Screen */}
                {kioskStep === 'shopping_checkout' && (
                  <ShoppingScreen
                    config={config}
                    mode="checkout"
                    onBack={handleResetKiosk}
                  />
                )}

                {/* Step 2C: Barber Selection */}
                {kioskStep === 'barber_select' && (
                  <BarberSelect
                    barbers={barbers}
                    checkIns={checkIns}
                    mode={checkInMode}
                    onSelectBarber={(barber) => {
                      setSelectedBarber(barber);
                      setIsCheckInModalOpen(true);
                    }}
                    onSelectFirstAvailable={() => {
                      const working = barbers.filter(b => b.isWorking);
                      const freeBarber = working.find(b => !checkIns.some(c => (c.barberId === b.id || c.barberName === b.name) && c.status === 'in_chair')) || working[0] || barbers[0];
                      setSelectedBarber(freeBarber);
                      setIsCheckInModalOpen(true);
                    }}
                    onBack={handleResetKiosk}
                  />
                )}

                {/* Step 3: Check-in Name Form Modal */}
                {isCheckInModalOpen && selectedBarber && (
                  <ClientCheckInModal
                    selectedBarber={selectedBarber}
                    checkInType={checkInMode}
                    isBarberBusy={checkIns.some(c => (c.barberId === selectedBarber.id || c.barberName === selectedBarber.name) && c.status === 'in_chair')}
                    onSubmit={handleCheckInSubmit}
                    onCancel={() => setIsCheckInModalOpen(false)}
                  />
                )}

                {/* Step 4: Confirmation Screen */}
                {kioskStep === 'confirmed' && latestConfirmedRecord && (
                  <ConfirmationScreen
                    record={latestConfirmedRecord}
                    config={config}
                    onDone={handleResetKiosk}
                  />
                )}
              </main>
            )}

            {/* Tab 2: BARBER PORTAL WITH PASSCODE AUTHENTICATION & LIVE STATION QUEUE */}
            {currentTab === 'barber_portal' && (
              <div>
                {!authenticatedBarber ? (
                  <BarberLoginScreen
                    barbers={barbers}
                    onLoginSuccess={(barber) => {
                      notificationManager.setMyBarberPreference(barber.name);
                      setAuthenticatedBarber(barber);
                    }}
                    onBackToKiosk={() => {
                      setCurrentTab('kiosk');
                      handleResetKiosk();
                    }}
                  />
                ) : (
                  <BarberDashboard
                    currentBarber={authenticatedBarber}
                    barbers={barbers}
                    checkIns={checkIns}
                    rentRecords={rentRecords}
                    config={config}
                    onUpdateStatus={updateStatus}
                    onPayRent={payBoothRent}
                    onSaveBarbers={(updated) => {
                      saveBarbers(updated);
                      const refreshed = updated.find(b => b.id === authenticatedBarber.id);
                      if (refreshed) {
                        setAuthenticatedBarber(refreshed);
                      }
                    }}
                    onLockStation={() => setAuthenticatedBarber(null)}
                    onAddWalkinDirect={() => {
                      setCurrentTab('kiosk');
                      setCheckInMode('walkin');
                      setKioskStep('barber_select');
                    }}
                  />
                )}
              </div>
            )}

            {/* Tab 3: ADMIN & SHOP SETTINGS */}
            {currentTab === 'admin' && (
              <AdminDashboard
                currentShop={activeShop}
                barbers={barbers}
                config={config}
                checkIns={checkIns}
                rentRecords={rentRecords}
                supportMessages={supportMessages}
                onMarkPaidOffline={markRentPaidOffline}
                onSaveBarbers={saveBarbers}
                onSaveConfig={saveConfig}
                onSendSupportMessage={handleSendSupportMessage}
                onMarkSupportRead={handleMarkSupportRead}
              />
            )}

            {/* Staff Access Buttons on Customer Kiosk Screen (Only for this specific shop) */}
            {currentTab === 'kiosk' && (
              <div className="staff-bottom-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <button
                  onClick={() => {
                    setAuthenticatedBarber(null);
                    setCurrentTab('barber_portal');
                  }}
                  className="staff-trigger-pill barber-btn"
                  title="Barber Station Hub & Booth Rent"
                >
                  <Scissors size={14} />
                  <span>Barber Hub</span>
                </button>

                <button
                  onClick={() => handleOpenStaffModal('admin')}
                  className="staff-trigger-pill owner-btn"
                  title="Shop Owner Admin & Rent Ledger"
                  style={{ position: 'relative' }}
                >
                  <Lock size={13} />
                  <span>Owner Admin</span>
                  {unreadHqMessages.length > 0 && (
                    <span style={{
                      background: 'var(--pastel-red, #EF4444)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: 9999,
                      marginLeft: '2px',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                    }}>
                      {unreadHqMessages.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Global In-App Support Chat Drawer (Triggered by toast or in-app buttons) */}
      <SupportChatDrawer
        isOpen={isGlobalSupportChatOpen}
        onClose={() => setIsGlobalSupportChatOpen(false)}
        currentShop={activeShop}
        messages={supportMessages}
        userRole="shop_owner"
        onSendMessage={handleSendSupportMessage}
        onMarkRead={handleMarkSupportRead}
      />

      {/* Security PIN Modal */}
      {showPinModal && (
        <PinModal
          correctPin={config.pinCode}
          onSuccess={() => {
            setShowPinModal(false);
            setCurrentTab(targetTabAfterUnlock);
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
}

export default App;
