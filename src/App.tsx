import { useState } from 'react';
import { Lock, ArrowLeft, Sliders, Bell } from 'lucide-react';
import type { Barber, CheckInRecord, MainNavTab } from './types';
import { useLiveSystem } from './utils/liveSync';
import { notificationManager } from './utils/notifications';

import { KioskHome } from './components/Kiosk/KioskHome';
import { ShoppingScreen } from './components/Kiosk/ShoppingScreen';
import { BarberSelect } from './components/Kiosk/BarberSelect';
import { ClientCheckInModal } from './components/Kiosk/ClientCheckInModal';
import { ConfirmationScreen } from './components/Kiosk/ConfirmationScreen';
import { BarberDashboard } from './components/BarberPortal/BarberDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { PinModal } from './components/Admin/PinModal';

import './App.css';

export function App() {
  // Check URL query parameters for direct staff access e.g., ?portal=barber or ?portal=admin
  const getInitialTab = (): MainNavTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const portal = params.get('portal');
      if (portal === 'barber' || portal === 'barber_portal') return 'barber_portal';
      if (portal === 'admin') return 'admin';
    }
    return 'kiosk';
  };

  // Navigation State
  const [currentTab, setCurrentTab] = useState<MainNavTab>(getInitialTab);
  const [kioskStep, setKioskStep] = useState<'home' | 'shopping_browsing' | 'shopping_checkout' | 'barber_select' | 'confirmed'>('home');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [latestConfirmedRecord, setLatestConfirmedRecord] = useState<CheckInRecord | null>(null);

  // Security / Kiosk lock
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetTabAfterUnlock, setTargetTabAfterUnlock] = useState<MainNavTab>('barber_portal');

  // Real-time Cloud + Local Live System
  const {
    barbers,
    config,
    checkIns,
    rentRecords,
    addCheckIn,
    updateStatus,
    saveBarbers,
    saveConfig,
    payBoothRent,
    markRentPaidOffline
  } = useLiveSystem();

  // Handle new Client Check-in from Kiosk
  const handleCheckInSubmit = async (clientName: string, appointmentTime: string) => {
    if (!selectedBarber) return;

    const record = await addCheckIn(clientName, selectedBarber, appointmentTime);

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
    await addCheckIn('Store Shopper', shopBarber, 'Ready to Checkout');

    // 3. Display confirmation screen
    setKioskStep('shopping_checkout');
  };

  const handleResetKiosk = () => {
    setKioskStep('home');
    setSelectedBarber(null);
    setIsCheckInModalOpen(false);
    setLatestConfirmedRecord(null);
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

      <div className="content-wrapper" style={{ padding: currentTab === 'kiosk' ? '36px 20px 20px' : '20px' }}>
        
        {/* STAFF VIEWS HEADER (Only shown when inside Barber Portal or Admin) */}
        {currentTab !== 'kiosk' && (
          <header style={{ marginBottom: '20px' }}>
            {/* Center Top OF Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '14px' }}>
              <img
                src="/logo.png"
                alt="OF Barber & Supply"
                style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* Navigation Controls Bar */}
            <div className="staff-nav-bar">
              <button
                onClick={() => {
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    setCurrentTab('barber_portal');
                  }}
                  className={`nav-pill-btn ${currentTab === 'barber_portal' ? 'active' : ''}`}
                  style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                >
                  <Bell size={15} />
                  <span>Barber Hub</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('admin');
                  }}
                  className={`nav-pill-btn ${currentTab === 'admin' ? 'active' : ''}`}
                  style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                >
                  <Sliders size={15} />
                  <span>Admin</span>
                </button>
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
                onSelectBrowsing={() => setKioskStep('shopping_browsing')}
                onSelectCheckout={handleShoppingCheckout}
                onSelectAppointment={() => setKioskStep('barber_select')}
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

            {/* Step 2B: Barber Selection */}
            {kioskStep === 'barber_select' && (
              <BarberSelect
                barbers={barbers}
                onSelectBarber={(barber) => {
                  setSelectedBarber(barber);
                  setIsCheckInModalOpen(true);
                }}
                onBack={handleResetKiosk}
              />
            )}

            {/* Step 3: Check-in Name Form Modal */}
            {isCheckInModalOpen && selectedBarber && (
              <ClientCheckInModal
                selectedBarber={selectedBarber}
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

        {/* Tab 2: BARBER PORTAL & LIVE STATION QUEUE */}
        {currentTab === 'barber_portal' && (
          <BarberDashboard
            barbers={barbers}
            checkIns={checkIns}
            rentRecords={rentRecords}
            config={config}
            onUpdateStatus={updateStatus}
            onPayRent={payBoothRent}
            onAddWalkinDirect={() => {
              setCurrentTab('kiosk');
              setKioskStep('barber_select');
            }}
          />
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

        {/* Staff / Barber Hub Quick Access Button */}
        {currentTab === 'kiosk' && (
          <div className="staff-lock-container">
            <button
              onClick={() => handleOpenStaffModal('barber_portal')}
              className="staff-hub-trigger-btn"
              title="Barber Hub & Staff Access (PIN Required)"
            >
              <Lock size={14} />
              <span>Barber Hub</span>
            </button>
          </div>
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
