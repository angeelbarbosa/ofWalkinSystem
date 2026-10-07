import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  Users, 
  Download, 
  Check,
  DollarSign,
  HelpCircle,
  CreditCard,
  Building2,
  Lock
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord, Shop, SupportMessage, SubscriptionPaymentMethod } from '../../types';
import { RentLedgerDashboard } from './RentLedgerDashboard';
import { ShopPayoutSettings } from './ShopPayoutSettings';
import { SupportChatDrawer } from '../Shared/SupportChatDrawer';
import { ShopSubscriptionModal } from './ShopSubscriptionModal';

interface AdminDashboardProps {
  currentShop?: Shop | null;
  barbers: Barber[];
  config: ShopConfig;
  checkIns: CheckInRecord[];
  rentRecords?: RentPaymentRecord[];
  supportMessages?: SupportMessage[];
  onMarkPaidOffline?: (barber: Barber, method: 'cash' | 'zelle' | 'manual', notes?: string) => void;
  onSaveBarbers: (barbers: Barber[]) => void;
  onSaveConfig: (config: ShopConfig) => void;
  onSendSupportMessage?: (text: string) => void;
  onMarkSupportRead?: () => void;
  onPayShopSubscription?: (paymentMethod: SubscriptionPaymentMethod) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentShop = null,
  barbers,
  config,
  checkIns,
  rentRecords = [],
  supportMessages = [],
  onMarkPaidOffline = () => {},
  onSaveBarbers,
  onSaveConfig,
  onSendSupportMessage = () => {},
  onMarkSupportRead = () => {},
  onPayShopSubscription = () => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'rent' | 'payouts' | 'settings' | 'history' | 'subscription'>('rent');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isPaySubscriptionOpen, setIsPaySubscriptionOpen] = useState(false);
  
  // Barbers Management State
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpec, setNewBarberSpec] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');
  const [newBarberStation, setNewBarberStation] = useState<number>(barbers.length + 1);
  const [newBarberPasscode, setNewBarberPasscode] = useState('1111');

  // Shop Settings State
  const [welcomeShoppingBody, setWelcomeShoppingBody] = useState(config.welcomeShoppingBody);
  const [autoResetShoppingSec, setAutoResetShoppingSec] = useState(config.autoResetShoppingSec);
  const [autoResetAppointmentSec, setAutoResetAppointmentSec] = useState(config.autoResetAppointmentSec);
  const [pinCode, setPinCode] = useState(config.pinCode);

  // Save Settings
  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopConfig = {
      ...config,
      shopName: config.shopName,
      welcomeShoppingBody,
      autoResetShoppingSec: Number(autoResetShoppingSec),
      autoResetAppointmentSec: Number(autoResetAppointmentSec),
      soundAlertsEnabled: false,
      pinCode
    };
    onSaveConfig(updated);
    alert('Settings saved successfully!');
  };

  // Add / Edit Barber
  const handleSaveBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim()) return;

    if (editingBarber) {
      const updated = barbers.map(b => b.id === editingBarber.id ? {
        ...b,
        name: newBarberName.trim(),
        specialty: newBarberSpec.trim(),
        phone: newBarberPhone.trim(),
        stationNumber: Number(newBarberStation),
        passcode: newBarberPasscode.trim() || b.passcode || '1111'
      } : b);
      onSaveBarbers(updated);
      setEditingBarber(null);
    } else {
      const newBarber: Barber = {
        id: 'barber-' + Date.now(),
        name: newBarberName.trim(),
        specialty: newBarberSpec.trim() || 'Master Cuts & Grooming',
        phone: newBarberPhone.trim() || '(555) 000-0000',
        stationNumber: Number(newBarberStation) || barbers.length + 1,
        avatar: '',
        avatarColor: '#09090B',
        isWorking: true,
        pushSubscriptionActive: true,
        passcode: newBarberPasscode.trim() || '1111'
      };
      onSaveBarbers([...barbers, newBarber]);
      setIsAddingBarber(false);
    }

    // Reset Form
    setNewBarberName('');
    setNewBarberSpec('');
    setNewBarberPhone('');
    setNewBarberPasscode('1111');
  };

  const handleToggleWorking = (barberId: string) => {
    const updated = barbers.map(b => b.id === barberId ? { ...b, isWorking: !b.isWorking } : b);
    onSaveBarbers(updated);
  };

  const handleDeleteBarber = (barberId: string) => {
    if (confirm('Are you sure you want to remove this barber?')) {
      onSaveBarbers(barbers.filter(b => b.id !== barberId));
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Client Name', 'Type', 'Barber', 'Time Slot', 'Check-in Time', 'Status'];
    const rows = checkIns.map(c => [
      c.id,
      `"${c.clientName}"`,
      c.type,
      `"${c.barberName || 'N/A'}"`,
      `"${c.appointmentTime || 'N/A'}"`,
      `"${c.checkInTime}"`,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `checkins_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pop-in" style={{ width: '100%', maxWidth: '680px', margin: '0 auto', paddingBottom: 'max(120px, env(safe-area-inset-bottom, 32px))' }}>
      {/* Top Banner & Sub-Tabs */}
      <div className="portal-header-banner" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 850, color: 'var(--text-primary)', marginBottom: 2 }}>
            Shop Manager & Settings
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Manage barbers, adjust timers & view check-in logs
          </p>
        </div>

        <div className="portal-barber-filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('rent')}
            className={`barber-tab-chip ${activeSubTab === 'rent' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'rent' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'rent' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <DollarSign size={15} />
            <span>Booth Rent Ledger</span>
          </button>

          <button
            onClick={() => setActiveSubTab('payouts')}
            className={`barber-tab-chip ${activeSubTab === 'payouts' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'payouts' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'payouts' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <Building2 size={15} />
            <span>Payout Banking</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className={`barber-tab-chip ${activeSubTab === 'roster' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'roster' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'roster' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <Users size={15} />
            <span>Barbers ({barbers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`barber-tab-chip ${activeSubTab === 'settings' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'settings' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'settings' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <Settings size={15} />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('subscription')}
            className={`barber-tab-chip ${activeSubTab === 'subscription' ? 'active' : ''}`}
            style={{ 
              padding: '8px 14px', 
              borderRadius: 9999, 
              fontSize: '0.82rem', 
              fontWeight: 750, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              background: activeSubTab === 'subscription' ? 'var(--accent-primary)' : 'var(--surface-pill)', 
              color: activeSubTab === 'subscription' ? 'var(--bg-main)' : 'var(--text-primary)', 
              border: '1px solid var(--border-subtle)', 
              cursor: 'pointer' 
            }}
          >
            <CreditCard size={15} />
            <span>Subscription & Billing</span>
            {currentShop?.subscriptionStatus === 'past_due' && (
              <span style={{
                background: 'var(--pastel-red)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 9999,
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                Due
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`barber-tab-chip ${activeSubTab === 'history' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'history' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'history' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <Download size={15} />
            <span>Logs ({checkIns.length})</span>
          </button>

          <button
            onClick={() => setIsSupportOpen(true)}
            className="barber-tab-chip"
            style={{ 
              padding: '8px 14px', 
              borderRadius: 9999, 
              fontSize: '0.82rem', 
              fontWeight: 750, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              background: 'var(--pastel-blue-bg)', 
              color: 'var(--pastel-blue)', 
              border: '1px solid var(--pastel-blue-border)', 
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            <HelpCircle size={15} />
            <span>Support Chat</span>
            {supportMessages.filter(m => m.shopSlug === currentShop?.slug && !m.readByShop && m.sender === 'platform_hq').length > 0 && (
              <span style={{
                background: 'var(--pastel-red)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 9999
              }}>
                {supportMessages.filter(m => m.shopSlug === currentShop?.slug && !m.readByShop && m.sender === 'platform_hq').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tab 0: Booth Rent Ledger */}
      {activeSubTab === 'rent' && (
        <RentLedgerDashboard
          barbers={barbers}
          rentRecords={rentRecords}
          config={config}
          onMarkPaidOffline={onMarkPaidOffline}
          onSaveBarbers={onSaveBarbers}
        />
      )}

      {/* Sub-Tab 1: Barbers Roster */}
      {activeSubTab === 'roster' && (
        <div className="admin-card slide-up" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Barber Team</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Manage active barbers and station assignments</p>
            </div>

            <button
              onClick={() => {
                setEditingBarber(null);
                setNewBarberName('');
                setNewBarberSpec('');
                setNewBarberPhone('');
                setNewBarberStation(barbers.length + 1);
                setIsAddingBarber(true);
              }}
              className="choice-card-action-btn"
              style={{ width: 'auto', padding: '9px 18px', fontSize: '0.88rem' }}
            >
              <Plus size={16} />
              <span>Add Barber</span>
            </button>
          </div>

          {/* Barbers Table */}
          <div className="table-responsive">
            <table className="bubbly-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Barber</th>
                  <th>Station PIN</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {barbers.map((barber) => (
                  <tr key={barber.id}>
                    <td>
                      <span style={{ fontWeight: 800, background: 'var(--surface-pill)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: 9999, fontSize: '0.82rem', border: '1px solid var(--border-subtle)' }}>
                        #{barber.stationNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: 'var(--surface-pill)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800
                          }}
                        >
                          {barber.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{barber.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', background: 'var(--surface-pill)', padding: '3px 8px', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                        {barber.passcode || '1111'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleWorking(barber.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: '0.78rem',
                          fontWeight: 750,
                          background: barber.isWorking ? 'var(--pastel-green-bg)' : 'var(--surface-pill)',
                          color: barber.isWorking ? 'var(--pastel-green)' : 'var(--text-muted)',
                          border: barber.isWorking ? '1px solid var(--pastel-green-border)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        <span>{barber.isWorking ? 'Active' : 'Off Duty'}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setEditingBarber(barber);
                            setNewBarberName(barber.name);
                            setNewBarberSpec(barber.specialty);
                            setNewBarberPhone(barber.phone);
                            setNewBarberStation(barber.stationNumber);
                            setNewBarberPasscode(barber.passcode || '1111');
                            setIsAddingBarber(true);
                          }}
                          className="back-pill-btn"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          title="Edit Barber"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteBarber(barber.id)}
                          className="back-pill-btn"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--pastel-red)' }}
                          title="Delete Barber"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add / Edit Barber Modal */}
          {isAddingBarber && (
            <div className="modal-overlay">
              <div className="bubbly-modal-card pop-in" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-bubble)', padding: '24px 20px', maxWidth: 420 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 850, color: 'var(--text-primary)', marginBottom: 16 }}>
                  {editingBarber ? 'Edit Barber' : 'Add Barber'}
                </h3>
                <form onSubmit={handleSaveBarber}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brandon"
                      value={newBarberName}
                      onChange={e => setNewBarberName(e.target.value)}
                      className="bubbly-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Station #</label>
                      <input
                        type="number"
                        value={newBarberStation}
                        onChange={e => setNewBarberStation(Number(e.target.value))}
                        className="bubbly-input"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Station PIN</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="1111"
                        value={newBarberPasscode}
                        onChange={e => setNewBarberPasscode(e.target.value)}
                        className="bubbly-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingBarber(false)}
                      className="back-pill-btn"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="choice-card-action-btn"
                      style={{ flex: 2 }}
                    >
                      <Check size={16} />
                      <span>{editingBarber ? 'Save Changes' : 'Add Barber'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab: Payout Banking & Stripe Connect */}
      {activeSubTab === 'payouts' && (
        <ShopPayoutSettings
          config={config}
          onSaveConfig={onSaveConfig}
        />
      )}

      {/* Sub-Tab 2: Settings */}
      {activeSubTab === 'settings' && (
        <div className="admin-card slide-up" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Kiosk Settings
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Tailor greetings, auto-reset timers, and security PIN
          </p>

          <form onSubmit={handleSaveShopSettings}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
                {config.enableShoppingMode ? 'Shopping Welcome Message' : 'Kiosk Welcome Greeting'}
              </label>
              <textarea
                rows={3}
                value={welcomeShoppingBody}
                onChange={e => setWelcomeShoppingBody(e.target.value)}
                className="bubbly-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {config.enableShoppingMode && (
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Shopping Reset (s)</label>
                  <input
                    type="number"
                    value={autoResetShoppingSec}
                    onChange={e => setAutoResetShoppingSec(Number(e.target.value))}
                    className="bubbly-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Check-in Reset (s)</label>
                <input
                  type="number"
                  value={autoResetAppointmentSec}
                  onChange={e => setAutoResetAppointmentSec(Number(e.target.value))}
                  className="bubbly-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Manager PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  className="bubbly-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="choice-card-action-btn"
              style={{ maxWidth: 220, marginTop: 16 }}
            >
              <Check size={16} />
              <span>Save Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 4: Check-in Logs History */}
      {activeSubTab === 'history' && (
        <div className="admin-card slide-up" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Check-in History</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Audit trail of all arrivals</p>
            </div>

            <button
              onClick={handleExportCSV}
              className="choice-card-action-btn"
              style={{ width: 'auto', padding: '9px 16px', fontSize: '0.85rem' }}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="bubbly-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Barber</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.clientName}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{item.barberName}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.76rem', fontWeight: 750, padding: '3px 8px', borderRadius: 9999, background: 'var(--surface-pill)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Subscription & Billing */}
      {activeSubTab === 'subscription' && currentShop && (
        <div className="admin-card slide-up" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Platform SaaS Billing
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 9999,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: currentShop.subscriptionStatus === 'active' 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : currentShop.subscriptionStatus === 'past_due' 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : 'rgba(59, 130, 246, 0.15)',
                  color: currentShop.subscriptionStatus === 'active' 
                    ? 'var(--pastel-green, #10B981)' 
                    : currentShop.subscriptionStatus === 'past_due' 
                    ? 'var(--pastel-red, #EF4444)' 
                    : 'var(--pastel-blue, #3B82F6)',
                  border: '1px solid currentColor'
                }}>
                  {currentShop.subscriptionStatus ? currentShop.subscriptionStatus.toUpperCase() : 'ACTIVE'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                {currentShop.name} License
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Your dedicated walk-in kiosk, booth rent tracking, and barber station software
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPaySubscriptionOpen(true)}
              className="choice-card-action-btn"
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CreditCard size={16} />
              <span>Pay with Stripe / Apple Pay</span>
            </button>
          </div>

          {/* Pricing & Renewal Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>Base Subscription</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                ${(currentShop.subscriptionMonthlyFee ?? currentShop.monthlyPlanPrice ?? 49).toFixed(2)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}> / month</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Billed monthly</span>
            </div>

            <div style={{ background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>Next Billing Renewal</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: 4 }}>
                {currentShop.subscriptionNextBillingDate || 'Nov 1, 2026'}
              </div>
              <span style={{ fontSize: '0.7rem', color: currentShop.subscriptionStatus === 'past_due' ? 'var(--pastel-red)' : 'var(--pastel-green)' }}>
                {currentShop.subscriptionStatus === 'past_due' ? 'Past Due - Please Renew' : 'Active Through Cycle'}
              </span>
            </div>

            <div style={{ background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '16px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)' }}>Last Payment Method</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 850, color: 'var(--accent-primary)', marginTop: 4, textTransform: 'capitalize' }}>
                {currentShop.subscriptionPaymentMethod === 'apple_pay' ? 'Apple Pay' : currentShop.subscriptionPaymentMethod === 'card' || currentShop.subscriptionPaymentMethod === 'stripe' ? 'Stripe Card' : currentShop.subscriptionPaymentMethod || 'Stripe'}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Paid on {currentShop.subscriptionLastPaidDate || 'Oct 1, 2026'}
              </span>
            </div>
          </div>

          {/* Stripe Fee Transparency Banner */}
          <div style={{ background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.92rem' }}>
              <Lock size={15} color="var(--pastel-green)" />
              <span>Stripe Processing Fee Transparency</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              All online transactions are securely encrypted and processed directly via Stripe at standard network interchange rates (<strong>2.9% + 30¢</strong>). When paying your $49.00/mo subscription, the $1.72 fee is included in your checkout total ($50.72) with no hidden platform markups.
            </p>
          </div>

          {/* Features Included List */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px' }}>
              What's Included In Your Shop License:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {[
                'Unlimited Client Walk-In & Appointment Queue Check-Ins',
                'Dedicated Barber Station Hubs with Personal PINs',
                'Automated Weekly Booth Rent Collection & Ledgers',
                'Live Multi-Device Cloud Sync (iPhone, iPad, Mac)',
                'Direct In-App Platform Support Line to Platform HQ',
                'Real-Time Live Queue Lobby Display & Mobile Alerts'
              ].map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Check size={14} style={{ color: 'var(--pastel-green)', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Direct In-App Support Chat Drawer */}
      <SupportChatDrawer
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        currentShop={currentShop}
        messages={supportMessages}
        userRole="shop_owner"
        onSendMessage={(text) => {
          if (currentShop) {
            onSendSupportMessage(text);
          }
        }}
        onMarkRead={onMarkSupportRead}
      />

      {/* Shop Owner Subscription Payment Modal */}
      {isPaySubscriptionOpen && currentShop && (
        <ShopSubscriptionModal
          shop={currentShop}
          onPaySubscription={(paymentMethod) => {
            onPayShopSubscription(paymentMethod);
          }}
          onClose={() => setIsPaySubscriptionOpen(false)}
        />
      )}
    </div>
  );
};

