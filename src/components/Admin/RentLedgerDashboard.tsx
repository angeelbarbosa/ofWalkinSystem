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
    <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header Overview & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {/* Metric 1: Total Collected */}
        <div style={{ background: '#FFFFFF', padding: '20px 22px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase' }}>Rent Collected</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F4F4F5', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#09090B' }}>
            ${totalCollected.toLocaleString()}
            <span style={{ fontSize: '0.9rem', color: '#71717A', fontWeight: 600 }}> / ${totalExpectedRent.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#22C55E', fontWeight: 700, marginTop: 4 }}>
            {collectionRate}% on-time this week
          </div>
        </div>

        {/* Metric 2: Outstanding Balance */}
        <div style={{ background: '#FFFFFF', padding: '20px 22px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase' }}>Unpaid / Due</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F4F4F5', color: '#EAB308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: totalOutstanding > 0 ? '#E11D48' : '#09090B' }}>
            ${totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#71717A', fontWeight: 600, marginTop: 4 }}>
            {barberPaymentStatus.filter(b => !b.isPaid).length} chairs pending payment
          </div>
        </div>

        {/* Metric 3: Active Stations */}
        <div style={{ background: '#FFFFFF', padding: '20px 22px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#71717A', textTransform: 'uppercase' }}>Direct Deposits</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F4F4F5', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#09090B' }}>
            Stripe Active
          </div>
          <div style={{ fontSize: '0.8rem', color: '#71717A', fontWeight: 600, marginTop: 4 }}>
            Direct bank deposits on payment
          </div>
        </div>
      </div>

      {/* 2. Barbers Station Rent Roster Grid */}
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#09090B' }}>
              Station Rent Status
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#71717A' }}>
              Track payments, record offline cash/Zelle, and adjust chair fees
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="back-pill-btn"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Reminder toast */}
        {reminderSentFor && (
          <div className="slide-down" style={{ background: '#09090B', color: '#FFFFFF', padding: '10px 16px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={14} />
            <span>Payment reminder notification sent to {reminderSentFor}!</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {barberPaymentStatus.map(({ barber, isPaid, latestPayment, amount }) => (
            <div
              key={barber.id}
              style={{
                background: isPaid ? '#FAFAFA' : '#FFFFFF',
                border: isPaid ? '1px solid #E4E4E7' : '1.5px solid #F43F5E',
                borderRadius: 18,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: '#09090B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.95rem'
                    }}
                  >
                    {barber.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 850, color: '#09090B' }}>
                      {barber.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 600 }}>
                      Station #{barber.stationNumber} • ${amount}/week
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 9999,
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: isPaid ? '#DCFCE7' : '#FFE4E6',
                    color: isPaid ? '#15803D' : '#BE123C'
                  }}
                >
                  {isPaid ? '🟢 Paid' : '🔴 Unpaid'}
                </span>
              </div>

              {latestPayment && isPaid ? (
                <div style={{ fontSize: '0.8rem', color: '#71717A', background: '#FFFFFF', padding: '8px 12px', borderRadius: 10, border: '1px solid #E4E4E7' }}>
                  Paid via <strong>{latestPayment.paymentMethod === 'apple_pay' ? ' Apple Pay' : latestPayment.paymentMethod?.toUpperCase()}</strong> • {new Date(latestPayment.paidAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#BE123C', background: '#FFF1F2', padding: '8px 12px', borderRadius: 10 }}>
                  Rent due for current weekly cycle ($ {amount}.00)
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
          <div className="bubbly-modal-card pop-in" style={{ maxWidth: 440, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#09090B' }}>
                Record Payment for {selectedBarberForCash.name}
              </h3>
              <button
                onClick={() => setSelectedBarberForCash(null)}
                style={{ background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordOfflinePayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {(['zelle', 'cash', 'manual'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCashPaymentMethod(m)}
                      style={{
                        padding: '10px',
                        borderRadius: 12,
                        border: cashPaymentMethod === m ? '2px solid #09090B' : '1px solid #E4E4E7',
                        background: cashPaymentMethod === m ? '#F4F4F5' : '#FFFFFF',
                        fontWeight: 750,
                        fontSize: '0.85rem',
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

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
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
          <div className="bubbly-modal-card pop-in" style={{ maxWidth: 400, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#09090B' }}>
                Set Rent for {editingRentBarber.name}
              </h3>
              <button
                onClick={() => setEditingRentBarber(null)}
                style={{ background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
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
                  <span>Save Rent Rate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Historical Payment Ledger Table */}
      <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '24px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: '#09090B', marginBottom: 16 }}>
          Payment History & Receipts
        </h3>

        <div className="table-responsive">
          <table className="bubbly-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Barber</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Date Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rentRecords.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 750, color: '#09090B' }}>{r.receiptNumber}</td>
                  <td>
                    <strong>{r.barberName}</strong> (Station #{r.stationNumber})
                  </td>
                  <td style={{ fontWeight: 800, color: '#09090B' }}>
                    ${r.totalPaid.toFixed(2)}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {r.paymentMethod === 'apple_pay' ? ' Apple Pay' : r.paymentMethod || 'Card'}
                  </td>
                  <td>
                    {new Date(r.paidAt || r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 800, background: '#DCFCE7', color: '#15803D' }}>
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
