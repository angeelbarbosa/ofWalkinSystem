import React, { useState, useEffect } from 'react';
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
import { ModalOverlay } from '../Shared/ModalOverlay';

interface RentLedgerDashboardProps {
  barbers: Barber[];
  rentRecords: RentPaymentRecord[];
  config: ShopConfig;
  onMarkPaidOffline: (barber: Barber, method?: RentPaymentRecord['paymentMethod'], notes?: string) => void;
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
  const [cashPaymentMethod, setCashPaymentMethod] = useState<RentPaymentRecord['paymentMethod']>('manual');
  const [cashNotes, setCashNotes] = useState('');
  const [editingRentBarber, setEditingRentBarber] = useState<Barber | null>(null);
  const [newRentAmount, setNewRentAmount] = useState<string>('200');
  const [showRentConfirm, setShowRentConfirm] = useState(false);
  const [reminderSentFor, setReminderSentFor] = useState<string | null>(null);
  const [rentFilter, setRentFilter] = useState<'all' | 'paid' | 'due'>('all');

  // Lock body scroll when popup/modal is open
  useEffect(() => {
    if (editingRentBarber || selectedBarberForCash) {
      const originalOverflow = document.body.style.overflow;
      const originalTouch = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouch;
      };
    }
  }, [editingRentBarber, selectedBarberForCash]);

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

  const paidCount = barberPaymentStatus.filter(b => b.isPaid).length;
  const dueCount = barberPaymentStatus.filter(b => !b.isPaid).length;
  const allCount = barberPaymentStatus.length;

  const filteredBarberPaymentStatus = barberPaymentStatus.filter(item => {
    if (rentFilter === 'paid') return item.isPaid;
    if (rentFilter === 'due') return !item.isPaid;
    return true;
  });

  const handleRecordOfflinePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberForCash) return;
    onMarkPaidOffline(selectedBarberForCash, cashPaymentMethod, cashNotes);
    setSelectedBarberForCash(null);
    setCashNotes('');
  };

  const handleRequestSaveRent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRentBarber) return;
    const parsedAmount = parseFloat(newRentAmount) || 0;
    const currentRent = editingRentBarber.weeklyRent || config.defaultWeeklyRent || 200;
    if (parsedAmount === currentRent) {
      setEditingRentBarber(null);
      return;
    }
    setShowRentConfirm(true);
  };

  const handleConfirmSaveRent = () => {
    if (!editingRentBarber) return;
    const parsedAmount = parseFloat(newRentAmount) || 0;
    const updated = barbers.map(b => 
      b.id === editingRentBarber.id ? { ...b, weeklyRent: parsedAmount, rentAmount: parsedAmount } : b
    );
    onSaveBarbers(updated);
    setEditingRentBarber(null);
    setShowRentConfirm(false);
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

          {/* Quick Rent Status Filter (All / Paid / Due) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--surface-pill, #1C1C21)',
              padding: '3px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setRentFilter('all')}
              style={{
                background: rentFilter === 'all' ? 'var(--surface-card, #27272A)' : 'transparent',
                border: rentFilter === 'all' ? '1px solid var(--border-subtle, rgba(255,255,255,0.12))' : 'none',
                color: rentFilter === 'all' ? 'var(--text-primary, #FFFFFF)' : 'var(--text-muted, #71717A)',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: rentFilter === 'all' ? 850 : 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>All</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: rentFilter === 'all' ? 'rgba(255,255,255,0.12)' : 'var(--surface-card-subtle)',
                  fontWeight: 800
                }}
              >
                {allCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRentFilter('paid')}
              style={{
                background: rentFilter === 'paid' ? 'var(--pastel-green-bg, rgba(16, 185, 129, 0.15))' : 'transparent',
                border: rentFilter === 'paid' ? '1px solid var(--pastel-green-border, rgba(16, 185, 129, 0.3))' : 'none',
                color: rentFilter === 'paid' ? 'var(--pastel-green, #10B981)' : 'var(--text-muted, #71717A)',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: rentFilter === 'paid' ? 850 : 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Paid</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: rentFilter === 'paid' ? 'rgba(16, 185, 129, 0.25)' : 'var(--surface-card-subtle)',
                  color: rentFilter === 'paid' ? 'var(--pastel-green, #10B981)' : 'var(--text-muted)',
                  fontWeight: 800
                }}
              >
                {paidCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRentFilter('due')}
              style={{
                background: rentFilter === 'due' ? 'var(--pastel-red-bg, rgba(239, 68, 68, 0.15))' : 'transparent',
                border: rentFilter === 'due' ? '1px solid var(--pastel-red-border, rgba(239, 68, 68, 0.3))' : 'none',
                color: rentFilter === 'due' ? 'var(--pastel-red, #EF4444)' : 'var(--text-muted, #71717A)',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: rentFilter === 'due' ? 850 : 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Due</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: rentFilter === 'due' ? 'rgba(239, 68, 68, 0.25)' : 'var(--surface-card-subtle)',
                  color: rentFilter === 'due' ? 'var(--pastel-red, #EF4444)' : 'var(--text-muted)',
                  fontWeight: 800
                }}
              >
                {dueCount}
              </span>
            </button>
          </div>
        </div>

        {/* Reminder toast */}
        {reminderSentFor && (
          <div className="slide-down" style={{ background: 'var(--text-primary)', color: 'var(--bg-main)', padding: '10px 16px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={14} />
            <span>Payment reminder notification sent to {reminderSentFor}!</span>
          </div>
        )}

        {filteredBarberPaymentStatus.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              background: 'var(--surface-pill)',
              borderRadius: 18,
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>
              {rentFilter === 'due' ? '🎉' : '📋'}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
              {rentFilter === 'due' ? 'No Rent Outstanding' : rentFilter === 'paid' ? 'No Payments Recorded Yet' : 'No Barbers Found'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {rentFilter === 'due' 
                ? 'All working barbers have paid their booth rent for this cycle!' 
                : rentFilter === 'paid'
                ? 'No barbers have marked their rent as paid for this cycle yet.'
                : 'No active barbers currently assigned to stations.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filteredBarberPaymentStatus.map(({ barber, isPaid, latestPayment, amount }) => (
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
                  Paid via <strong>{latestPayment.paymentMethod === 'apple_pay' ? 'Apple Pay' : latestPayment.paymentMethod?.toUpperCase()}</strong> • {new Date(latestPayment.paidAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    <span>Record Manual / Paid</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingRentBarber(barber);
                    const currentRate = barber.weeklyRent ?? config.defaultWeeklyRent ?? 200;
                    setNewRentAmount(String(currentRate));
                    setShowRentConfirm(false);
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
        )}
      </div>

      {/* 3. Record Offline Payment Modal */}
      {selectedBarberForCash && (
        <ModalOverlay onClose={() => setSelectedBarberForCash(null)} maxWidth={420}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {(['manual', 'card', 'stripe'] as const).map((m) => (
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
                    {m === 'manual' ? 'Manual Credit' : m}
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
              <label className="form-label">Notes / Reference (Optional)</label>
              <input
                type="text"
                placeholder="e.g. In-person card payment / shop credit"
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
        </ModalOverlay>
      )}

      {/* 4. Edit Chair Rent Amount Modal */}
      {editingRentBarber && (
        <ModalOverlay
          onClose={() => {
            setEditingRentBarber(null);
            setShowRentConfirm(false);
          }}
          maxWidth={400}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              {showRentConfirm ? 'Confirm Rate Change' : `Set Rent: ${editingRentBarber.name}`}
            </h3>
            <button
              onClick={() => {
                setEditingRentBarber(null);
                setShowRentConfirm(false);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {showRentConfirm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--surface-pill)', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 10, fontWeight: 750 }}>
                  Are you sure you want to change rent for <strong>{editingRentBarber.name}</strong>?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--surface-card)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Current Rate</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                      ${editingRentBarber.weeklyRent || config.defaultWeeklyRent || 200}/wk
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>➔</div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--pastel-green)', fontWeight: 800 }}>New Rate</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--pastel-green)' }}>
                      ${parseFloat(newRentAmount) || 0}/wk
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                This change will update in real-time across all devices and will immediately show on <strong>{editingRentBarber.name}</strong>'s payment screen.
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowRentConfirm(false)}
                  className="back-pill-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveRent}
                  className="choice-card-action-btn"
                  style={{ flex: 1.5, justifyContent: 'center' }}
                >
                  <Check size={16} />
                  <span>Yes, Change Rent</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRequestSaveRent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Weekly Booth Rent ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 200"
                  value={newRentAmount}
                  onChange={(e) => setNewRentAmount(e.target.value)}
                  className="bubbly-input"
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Current rate: ${editingRentBarber.weeklyRent || config.defaultWeeklyRent || 200} / week
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRentBarber(null);
                    setShowRentConfirm(false);
                  }}
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
          )}
        </ModalOverlay>
      )}

      {/* 5. Historical Payment Ledger Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 24, padding: '20px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              Payment History & Receipts
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Complete audit trail of all rent receipts and transactions
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="back-pill-btn"
            style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Export payment records to CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>

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
                    {r.paymentMethod === 'apple_pay' ? 'Apple Pay' : r.paymentMethod || 'Card'}
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
