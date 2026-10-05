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
        stationNumber: Number(newBarberStation)
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
        pushSubscriptionActive: true
      };
      onSaveBarbers([...barbers, newBarber]);
      setIsAddingBarber(false);
    }

    // Reset Form
    setNewBarberName('');
    setNewBarberSpec('');
    setNewBarberPhone('');
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
    <div className="pop-in">
      {/* Top Banner & Sub-Tabs */}
      <div className="portal-header-banner">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 850, color: '#09090B', marginBottom: 4 }}>
            Shop Manager & Settings
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#71717A' }}>
            Manage barbers, adjust timers & view check-in logs
          </p>
        </div>

        <div className="portal-barber-filter">
          <button
            onClick={() => setActiveSubTab('rent')}
            className={`barber-tab-chip ${activeSubTab === 'rent' ? 'active' : ''}`}
          >
            <DollarSign size={16} />
            <span>Booth Rent Ledger</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className={`barber-tab-chip ${activeSubTab === 'roster' ? 'active' : ''}`}
          >
            <Users size={16} />
            <span>Barbers ({barbers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`barber-tab-chip ${activeSubTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sms')}
            className={`barber-tab-chip ${activeSubTab === 'sms' ? 'active' : ''}`}
          >
            <MessageSquare size={16} />
            <span>SMS Backup</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`barber-tab-chip ${activeSubTab === 'history' ? 'active' : ''}`}
          >
            <Download size={16} />
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
        <div className="admin-card slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090B' }}>Barber Team</h3>
              <p style={{ fontSize: '0.85rem', color: '#71717A' }}>Manage active barbers and station assignments</p>
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
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <Plus size={18} />
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {barbers.map((barber) => (
                  <tr key={barber.id}>
                    <td>
                      <span style={{ fontWeight: 800, background: '#F4F4F5', padding: '4px 10px', borderRadius: 9999, fontSize: '0.85rem' }}>
                        #{barber.stationNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: '#F4F4F5',
                            color: '#09090B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Users size={18} />
                        </div>
                        <span style={{ fontWeight: 800, color: '#09090B' }}>{barber.name}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleWorking(barber.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 9999,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: barber.isWorking ? '#09090B' : '#E4E4E7',
                          color: barber.isWorking ? '#FFFFFF' : '#71717A',
                          cursor: 'pointer'
                        }}
                      >
                        <span>{barber.isWorking ? 'Active' : 'Off Duty'}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            setEditingBarber(barber);
                            setNewBarberName(barber.name);
                            setNewBarberSpec(barber.specialty);
                            setNewBarberPhone(barber.phone);
                            setNewBarberStation(barber.stationNumber);
                            setIsAddingBarber(true);
                          }}
                          className="back-pill-btn"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          title="Edit Barber"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteBarber(barber.id)}
                          className="back-pill-btn"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          title="Delete Barber"
                        >
                          <Trash2 size={14} />
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
              <div className="bubbly-modal-card pop-in">
                <h3 style={{ fontSize: '1.4rem', fontWeight: 850, color: '#09090B', marginBottom: 16 }}>
                  {editingBarber ? 'Edit Barber' : 'Add Barber'}
                </h3>
                <form onSubmit={handleSaveBarber}>
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brandon"
                      value={newBarberName}
                      onChange={e => setNewBarberName(e.target.value)}
                      className="bubbly-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Station #</label>
                    <input
                      type="number"
                      value={newBarberStation}
                      onChange={e => setNewBarberStation(Number(e.target.value))}
                      className="bubbly-input"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
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
                      <Check size={18} />
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
        <div className="admin-card slide-up">
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090B', marginBottom: 6 }}>
            Kiosk Settings
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#71717A', marginBottom: 24 }}>
            Tailor greetings, auto-reset timers, and security PIN
          </p>

          <form onSubmit={handleSaveShopSettings}>
            <div className="form-group">
              <label className="form-label">Shopping Welcome Message</label>
              <textarea
                rows={3}
                value={welcomeShoppingBody}
                onChange={e => setWelcomeShoppingBody(e.target.value)}
                className="bubbly-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Shopping Reset (Seconds)</label>
                <input
                  type="number"
                  value={autoResetShoppingSec}
                  onChange={e => setAutoResetShoppingSec(Number(e.target.value))}
                  className="bubbly-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check-in Reset (Seconds)</label>
                <input
                  type="number"
                  value={autoResetAppointmentSec}
                  onChange={e => setAutoResetAppointmentSec(Number(e.target.value))}
                  className="bubbly-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manager PIN</label>
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
              style={{ maxWidth: 240, marginTop: 16 }}
            >
              <Check size={18} />
              <span>Save Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Twilio SMS */}
      {activeSubTab === 'sms' && (
        <div className="admin-card slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F4F4F5', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 850, color: '#09090B' }}>
                Automated SMS Backup (Twilio)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#71717A' }}>
                Optionally text the barber's phone when a client arrives
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveShopSettings}>
            <div style={{ background: '#F4F4F5', borderRadius: 20, padding: 20, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={twilioEnabled}
                  onChange={e => setTwilioEnabled(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: '#09090B' }}
                />
                <span>Enable Twilio SMS Alerts to Barbers</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Twilio Account SID</label>
                  <input
                    type="text"
                    placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={accountSid}
                    onChange={e => setAccountSid(e.target.value)}
                    className="bubbly-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Twilio Auth Token</label>
                  <input
                    type="password"
                    placeholder="Your Twilio Token"
                    value={authToken}
                    onChange={e => setAuthToken(e.target.value)}
                    className="bubbly-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">From Phone Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={fromPhone}
                  onChange={e => setFromPhone(e.target.value)}
                  className="bubbly-input"
                  style={{ maxWidth: 360 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="choice-card-action-btn"
              style={{ maxWidth: 240 }}
            >
              <Check size={18} />
              <span>Save SMS Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 4: Check-in Logs History */}
      {activeSubTab === 'history' && (
        <div className="admin-card slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090B' }}>Check-in History</h3>
              <p style={{ fontSize: '0.85rem', color: '#71717A' }}>Audit trail of all arrivals</p>
            </div>

            <button
              onClick={handleExportCSV}
              className="choice-card-action-btn"
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <Download size={18} />
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
                      <div style={{ fontWeight: 800, color: '#09090B' }}>{item.clientName}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{item.barberName}</td>
                    <td style={{ fontSize: '0.85rem', color: '#71717A' }}>
                      {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: '#F4F4F5', color: '#09090B' }}>
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
