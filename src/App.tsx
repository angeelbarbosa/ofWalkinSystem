import { useState } from 'react';
import { Lock, ArrowLeft, Sliders, Bell } from 'lucide-react';
import type { Barber, CheckInRecord, MainNavTab } from './types';
import { useLiveSystem } from './utils/liveSync';

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
  const [kioskStep, setKioskStep] = useState<'home' | 'shopping' | 'barber_select' | 'confirmed'>('home');
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
    addCheckIn,
    updateStatus,
    saveBarbers,
    saveConfig
  } = useLiveSystem();

  // Handle new Client Check-in from Kiosk
  const handleCheckInSubmit = async (clientName: string, appointmentTime: string) => {
    if (!selectedBarber) return;

    const record = await addCheckIn(clientName, selectedBarber, appointmentTime);

    setLatestConfirmedRecord(record);
    setIsCheckInModalOpen(false);
    setKioskStep('confirmed');
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: '#FFFFFF', padding: '12px 20px', borderRadius: 9999, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setCurrentTab('kiosk');
                  handleResetKiosk();
                }}
                className="back-pill-btn"
              >
                <ArrowLeft size={16} />
                <span>Back to Customer Kiosk</span>
              </button>
              <img src="/logo.png" alt="OF Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setCurrentTab('barber_portal');
                }}
                className={`nav-pill-btn ${currentTab === 'barber_portal' ? 'active' : ''}`}
              >
                <Bell size={16} />
                <span>Barber Hub</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab('admin');
                }}
                className={`nav-pill-btn ${currentTab === 'admin' ? 'active' : ''}`}
              >
                <Sliders size={16} />
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: KIOSK FRONT ENTRANCE VIEW (Zero clutter, NO top bar for customers) */}
        {currentTab === 'kiosk' && (
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Step 1: Kiosk Home Choice Screen */}
            {kioskStep === 'home' && (
              <KioskHome
                config={config}
                onSelectShopping={() => setKioskStep('shopping')}
                onSelectAppointment={() => setKioskStep('barber_select')}
              />
            )}

            {/* Step 2A: Shopping Welcome Screen */}
            {kioskStep === 'shopping' && (
              <ShoppingScreen
                config={config}
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
            config={config}
            onUpdateStatus={updateStatus}
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
            onSaveBarbers={saveBarbers}
            onSaveConfig={saveConfig}
          />
        )}

        {/* Discreet Hidden Staff Unlock Button at Bottom Corner */}
        {currentTab === 'kiosk' && (
          <div style={{ position: 'fixed', bottom: 12, right: 12, opacity: 0.25, transition: 'opacity 0.2s' }}
               onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
               onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.25')}>
            <button
              onClick={() => handleOpenStaffModal('barber_portal')}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              title="Staff Access (PIN Required)"
            >
              <Lock size={16} />
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
