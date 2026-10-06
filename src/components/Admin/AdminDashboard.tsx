import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  Users, 
  MessageSquare, 
  Download, 
  Check,
  DollarSign
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig, RentPaymentRecord } from '../../types';
import { RentLedgerDashboard } from './RentLedgerDashboard';

interface AdminDashboardProps {
  barbers: Barber[];
  config: ShopConfig;
  checkIns: CheckInRecord[];
  rentRecords?: RentPaymentRecord[];
  onMarkPaidOffline?: (barber: Barber, method: 'cash' | 'zelle' | 'manual', notes?: string) => void;
  onSaveBarbers: (barbers: Barber[]) => void;
  onSaveConfig: (config: ShopConfig) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  barbers,
  config,
  checkIns,
  rentRecords = [],
  onMarkPaidOffline = () => {},
  onSaveBarbers,
  onSaveConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'rent' | 'settings' | 'sms' | 'history'>('rent');
  
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

  // SMS Twilio State
  const [twilioEnabled, setTwilioEnabled] = useState(config.twilioConfig?.enabled || false);
  const [accountSid, setAccountSid] = useState(config.twilioConfig?.accountSid || '');
  const [authToken, setAuthToken] = useState(config.twilioConfig?.authToken || '');
  const [fromPhone, setFromPhone] = useState(config.twilioConfig?.fromPhone || '');

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
      pinCode,
      twilioConfig: {
        enabled: twilioEnabled,
        accountSid,
        authToken,
        fromPhone
      }
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
            onClick={() => setActiveSubTab('sms')}
            className={`barber-tab-chip ${activeSubTab === 'sms' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'sms' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'sms' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <MessageSquare size={15} />
            <span>SMS Backup</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`barber-tab-chip ${activeSubTab === 'history' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6, background: activeSubTab === 'history' ? 'var(--accent-primary)' : 'var(--surface-pill)', color: activeSubTab === 'history' ? 'var(--bg-main)' : 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
          >
            <Download size={15} />
            <span>Logs ({checkIns.length})</span>
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

      {/* Sub-Tab 3: Twilio SMS */}
      {activeSubTab === 'sms' && (
        <div className="admin-card slide-up" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-pill)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                Automated SMS Backup
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Optionally text the barber's phone when a client arrives
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveShopSettings}>
            <div style={{ background: 'var(--surface-pill)', borderRadius: 18, padding: 16, marginBottom: 18, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem', marginBottom: 14 }}>
                <input
                  type="checkbox"
                  checked={twilioEnabled}
                  onChange={e => setTwilioEnabled(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--text-primary)' }}
                />
                <span>Enable Twilio SMS Alerts to Barbers</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Twilio Account SID</label>
                  <input
                    type="text"
                    placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={accountSid}
                    onChange={e => setAccountSid(e.target.value)}
                    className="bubbly-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Twilio Auth Token</label>
                  <input
                    type="password"
                    placeholder="Your Twilio Token"
                    value={authToken}
                    onChange={e => setAuthToken(e.target.value)}
                    className="bubbly-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 10 }}>
                <label className="form-label" style={{ color: 'var(--text-secondary)' }}>From Phone Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={fromPhone}
                  onChange={e => setFromPhone(e.target.value)}
                  className="bubbly-input"
                  style={{ maxWidth: 320 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="choice-card-action-btn"
              style={{ maxWidth: 220 }}
            >
              <Check size={16} />
              <span>Save SMS Settings</span>
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
    </div>
  );
};

