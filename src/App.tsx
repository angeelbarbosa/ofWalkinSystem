import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, Scissors, Shield } from 'lucide-react';
import type { Barber, CheckInRecord, MainNavTab } from './types';
import { useLiveSystem } from './utils/liveSync';
import { notificationManager } from './utils/notifications';

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

import './App.css';

export function App() {
  // Check URL query parameters for direct staff access e.g., ?portal=barber or ?portal=admin or ?portal=super_admin
  const getInitialTab = (): MainNavTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');
      if (portal === 'super_admin' || portal === 'superadmin') return 'super_admin';
      if (portal === 'barber' || portal === 'barber_portal') return 'barber_portal';
      if (portal === 'admin') return 'admin';
    }
    return 'kiosk';
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

  // Real-time Cloud + Multi-Shop Live System
  const {
    activeShopSlug,
    activeShop,
    shops,
    barbers,
    config,
    checkIns,
    rentRecords,
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
    markRentPaidOffline
  } = useLiveSystem();

  // Reset auth when switching shops
  useEffect(() => {
    setAuthenticatedBarber(null);
  }, [activeShopSlug]);

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

  return (
    <div className="app-container">
      {/* Soft Ambient Floating Bubbles */}
      <div className="ambient-bubble ambient-bubble-1" />
      <div className="ambient-bubble ambient-bubble-2" />

      <div className="content-wrapper" style={{ padding: currentTab === 'kiosk' ? '32px 16px 20px' : '20px' }}>
        
        {/* SUPER ADMIN DASHBOARD VIEW */}
        {currentTab === 'super_admin' ? (
          <SuperAdminDashboard
            shops={shops}
            activeShopSlug={activeShopSlug}
            onSwitchShop={switchShop}
            onCreateShop={createShop}
            onUpdateShop={updateShop}
            onDeleteShop={deleteShop}
            onFactoryReset={factoryReset}
            onLoadDemoFleet={loadDemoFleet}
            onNavigateTab={setCurrentTab}
          />
        ) : (
          <>
            {/* STAFF VIEWS HEADER (Only shown when inside Barber Portal or Admin) */}
            {currentTab !== 'kiosk' && (
              <header style={{ marginBottom: '20px' }}>
                {/* Navigation Controls Bar with Shop Switcher */}
                <div className="staff-nav-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setAuthenticatedBarber(null);
                        setCurrentTab('kiosk');
                        handleResetKiosk();
                      }}
                      className="back-pill-btn"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                      title="Exit to Customer Kiosk"
                    >
                      <ArrowLeft size={15} />
                      <span>Kiosk</span>
                    </button>

                    {/* Multi-Shop Switcher Dropdown */}
                    <ShopSwitcherBar
                      currentShop={activeShop}
                      shops={shops}
                      onSwitchShop={switchShop}
                      onNavigateTab={setCurrentTab}
                    />
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
                barbers={barbers}
                config={config}
                checkIns={checkIns}
                rentRecords={rentRecords}
                onMarkPaidOffline={markRentPaidOffline}
                onSaveBarbers={saveBarbers}
                onSaveConfig={saveConfig}
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
                >
                  <Lock size={13} />
                  <span>Owner Admin</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
