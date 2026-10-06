import React, { useState } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Download, 
  Send, 
  Check, 
  X
} from 'lucide-react';
import type { Barber, RentPaymentRecord, ShopConfig } from '../../types';

interface RentLedgerDashboardProps {
  barbers: Barber[];
  rentRecords: RentPaymentRecord[];
  config: ShopConfig;
  onMarkPaidOffline: (barber: Barber, method: 'cash' | 'zelle' | 'manual', notes?: string) => void;
  onSaveBarbers: (barbers: Barber[]) => void;
}

export const RentLedgerDashboard: React.FC<RentLedgerDashboardProps> = ({
  barbers,
  rentRecords,
  config,
  onMarkPaidOffline,
  onSaveBarbers
}) => {
  const [selectedBarberForCash, setSelectedBarberForCash] = useState<Barber | null>(null);
  const [cashPaymentMethod, setCashPaymentMethod] = useState<'cash' | 'zelle' | 'manual'>('zelle');
  const [cashNotes, setCashNotes] = useState('');
  const [editingRentBarber, setEditingRentBarber] = useState<Barber | null>(null);
  const [newRentAmount, setNewRentAmount] = useState<number>(200);
  const [reminderSentFor, setReminderSentFor] = useState<string | null>(null);

  // Rent Calculations for Current Period
  const activeBarbers = barbers.filter(b => b.isWorking);
  const totalExpectedRent = activeBarbers.reduce((sum, b) => sum + (b.weeklyRent || config.defaultWeeklyRent || 200), 0);

  // Group latest rent payment per barber
  const barberPaymentStatus = activeBarbers.map((barber) => {
    const latestPayment = rentRecords.find(r => r.barberId === barber.id && r.status === 'paid');
    const isPaidThisWeek = !!latestPayment;
    return {
      barber,
      isPaid: isPaidThisWeek,
      latestPayment,
      amount: barber.weeklyRent || config.defaultWeeklyRent || 200
    };
  });

  const totalCollected = barberPaymentStatus
    .filter(b => b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalOutstanding = totalExpectedRent - totalCollected;
  const collectionRate = totalExpectedRent > 0 ? Math.round((totalCollected / totalExpectedRent) * 100) : 0;

  const handleRecordOfflinePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberForCash) return;
    onMarkPaidOffline(selectedBarberForCash, cashPaymentMethod, cashNotes);
    setSelectedBarberForCash(null);
    setCashNotes('');
  };

  const handleSaveEditedRent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRentBarber) return;
    const updated = barbers.map(b => 
      b.id === editingRentBarber.id ? { ...b, weeklyRent: newRentAmount } : b
    );
    onSaveBarbers(updated);
    setEditingRentBarber(null);
  };

  const handleSendReminder = (barber: Barber) => {
    setReminderSentFor(barber.name);
    setTimeout(() => setReminderSentFor(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Receipt #,Barber Name,Station,Amount,Fee,Total,Status,Method,Date,Notes\n'];
    const rows = rentRecords.map(r => 
      `"${r.receiptNumber}","${r.barberName}",${r.stationNumber},$${r.amount},$${r.processingFee},$${r.totalPaid},"${r.status}","${r.paymentMethod || 'Card'}","${r.paidAt || r.dueDate}","${r.notes || ''}"`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booth-rent-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header Overview & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {/* Metric 1: Total Collected */}
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rent Collected</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--pastel-green-bg)', color: 'var(--pastel-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            ${totalCollected.toLocaleString()}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}> / ${totalExpectedRent.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--pastel-green)', fontWeight: 700, marginTop: 3 }}>
            {collectionRate}% collected this week
          </div>
        </div>

        {/* Metric 2: Outstanding Balance */}
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unpaid / Due</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--pastel-amber-bg)', color: 'var(--pastel-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: totalOutstanding > 0 ? 'var(--pastel-red)' : 'var(--text-primary)' }}>
            ${totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 3 }}>
            {barberPaymentStatus.filter(b => !b.isPaid).length} chairs pending payment
          </div>
        </div>

        {/* Metric 3: Active Stations */}
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Auto Payouts</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-pill)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            Active
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 3 }}>
            Direct bank deposits on payment
          </div>
        </div>
      </div>

      {/* 2. Barbers Station Rent Roster Grid */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 24, padding: '20px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              Station Rent Status
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Track payments, record offline cash/Zelle, and adjust chair fees
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="back-pill-btn"
            style={{ padding: '7px 12px', fontSize: '0.8rem' }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Reminder toast */}
        {reminderSentFor && (
          <div className="slide-down" style={{ background: 'var(--text-primary)', color: 'var(--bg-main)', padding: '10px 16px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={14} />
            <span>Payment reminder notification sent to {reminderSentFor}!</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {barberPaymentStatus.map(({ barber, isPaid, latestPayment, amount }) => (
            <div
              key={barber.id}
              style={{
                background: 'var(--surface-pill)',
                border: isPaid ? '1px solid var(--border-subtle)' : '1.5px solid var(--pastel-red-border)',
                borderRadius: 18,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.9rem'
                    }}
                  >
                    {barber.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 850, color: 'var(--text-primary)' }}>
                      {barber.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Station #{barber.stationNumber} • ${amount}/week
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 9999,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: isPaid ? 'var(--pastel-green-bg)' : 'var(--pastel-red-bg)',
                    color: isPaid ? 'var(--pastel-green)' : 'var(--pastel-red)',
                    border: isPaid ? '1px solid var(--pastel-green-border)' : '1px solid var(--pastel-red-border)'
                  }}
                >
                  {isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              {latestPayment && isPaid ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--surface-card)', padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  Paid via <strong>{latestPayment.paymentMethod === 'apple_pay' ? ' Apple Pay' : latestPayment.paymentMethod?.toUpperCase()}</strong> • {new Date(latestPayment.paidAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--pastel-red)', background: 'var(--pastel-red-bg)', padding: '7px 10px', borderRadius: 10, border: '1px solid var(--pastel-red-border)' }}>
                  Rent due for current weekly cycle (${amount}.00)
                </div>
              )}

              {/* Owner Action Buttons for this Barber */}
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                {!isPaid && (
                  <button
                    onClick={() => {
                      setSelectedBarberForCash(barber);
                    }}
                    className="choice-card-action-btn"
                    style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: 9999 }}
                  >
                    <DollarSign size={13} />
                    <span>Record Cash/Zelle</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingRentBarber(barber);
                    setNewRentAmount(barber.weeklyRent || 200);
                  }}
                  className="back-pill-btn"
                  style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                >
                  <span>Edit Rate</span>
                </button>

                {!isPaid && (
                  <button
                    onClick={() => handleSendReminder(barber)}
                    className="back-pill-btn"
                    style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                    title="Send buzz reminder to barber"
                  >
                    <Send size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Record Offline Cash/Zelle Modal */}
      {selectedBarberForCash && (
        <div className="modal-overlay">
          <div className="bubbly-modal-card pop-in" style={{ maxWidth: 420, padding: '24px 20px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-bubble)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                Record Rent: {selectedBarberForCash.name}
              </h3>
              <button
                onClick={() => setSelectedBarberForCash(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordOfflinePayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {(['zelle', 'cash', 'manual'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCashPaymentMethod(m)}
                      style={{
                        padding: '9px',
                        borderRadius: 12,
                        border: cashPaymentMethod === m ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                        background: cashPaymentMethod === m ? 'var(--surface-pill)' : 'var(--surface-card)',
                        color: 'var(--text-primary)',
                        fontWeight: 750,
                        fontSize: '0.82rem',
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Amount Paid ($)</label>
                <input
                  type="number"
                  disabled
                  value={selectedBarberForCash.weeklyRent || 200}
                  className="bubbly-input"
                />
              </div>

              <div>
                <label className="form-label">Notes / Confirmation # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Zelle confirmation #38291"
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  className="bubbly-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectedBarberForCash(null)}
                  className="back-pill-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="choice-card-action-btn"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  <Check size={16} />
                  <span>Confirm Paid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Chair Rent Amount Modal */}
      {editingRentBarber && (
        <div className="modal-overlay">
          <div className="bubbly-modal-card pop-in" style={{ maxWidth: 380, padding: '24px 20px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-bubble)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                Set Rent: {editingRentBarber.name}
              </h3>
              <button
                onClick={() => setEditingRentBarber(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Weekly Booth Rent ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10"
                  value={newRentAmount}
                  onChange={(e) => setNewRentAmount(Number(e.target.value))}
                  className="bubbly-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setEditingRentBarber(null)}
                  className="back-pill-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="choice-card-action-btn"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  <span>Save Rate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Historical Payment Ledger Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 24, padding: '20px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 850, color: 'var(--text-primary)', marginBottom: 14 }}>
          Payment History & Receipts
        </h3>

        <div className="table-responsive">
          <table className="bubbly-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Barber</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rentRecords.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 750, color: 'var(--text-primary)' }}>{r.receiptNumber}</td>
                  <td>
                    <strong>{r.barberName}</strong> (Station #{r.stationNumber})
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    ${r.totalPaid.toFixed(2)}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {r.paymentMethod === 'apple_pay' ? ' Apple Pay' : r.paymentMethod || 'Card'}
                  </td>
                  <td>
                    {new Date(r.paidAt || r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 800, background: 'var(--pastel-green-bg)', color: 'var(--pastel-green)', border: '1px solid var(--pastel-green-border)' }}>
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
