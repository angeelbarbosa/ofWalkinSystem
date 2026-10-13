import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Download, 
  Send, 
  Check, 
  X,
  Calendar,
  Search,
  Filter,
  AlertTriangle,
  Users
} from 'lucide-react';
import type { Barber, RentPaymentRecord, ShopConfig, CheckInRecord } from '../../types';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface RentLedgerDashboardProps {
  barbers: Barber[];
  rentRecords: RentPaymentRecord[];
  config: ShopConfig;
  checkIns?: CheckInRecord[];
  onMarkPaidOffline: (barber: Barber, method?: RentPaymentRecord['paymentMethod'], notes?: string, paidAmount?: number, weeksCovered?: number) => void;
  onSaveBarbers: (barbers: Barber[]) => void;
}

export const RentLedgerDashboard: React.FC<RentLedgerDashboardProps> = ({
  barbers,
  rentRecords,
  config,
  checkIns = [],
  onMarkPaidOffline,
  onSaveBarbers
}) => {
  const [selectedBarberForCash, setSelectedBarberForCash] = useState<Barber | null>(null);
  const [cashPaymentMethod, setCashPaymentMethod] = useState<RentPaymentRecord['paymentMethod']>('manual');
  const [cashNotes, setCashNotes] = useState('');
  const [cashWeeksToPay, setCashWeeksToPay] = useState<number>(1);
  const [cashPayOption, setCashPayOption] = useState<'all' | 'one' | 'custom'>('all');
  const [cashCustomAmount, setCashCustomAmount] = useState<string>('200');

  const [editingRentBarber, setEditingRentBarber] = useState<Barber | null>(null);
  const [newRentAmount, setNewRentAmount] = useState<string>('200');
  const [showRentConfirm, setShowRentConfirm] = useState(false);
  const [reminderSentFor, setReminderSentFor] = useState<string | null>(null);
  const [rentFilter, setRentFilter] = useState<'all' | 'paid' | 'due' | 'upcoming'>('all');
  const [isLiveQueueModalOpen, setIsLiveQueueModalOpen] = useState(false);

  // Live queue calculations from checkIns
  const waitingCheckIns = (checkIns || []).filter(c => {
    const status = (c.status || 'waiting').toLowerCase();
    return status === 'waiting' || status === 'called';
  });
  const inChairCheckIns = (checkIns || []).filter(c => (c.status || '').toLowerCase() === 'in_chair');
  const completedTodayCheckIns = (checkIns || []).filter(c => (c.status || '').toLowerCase() === 'completed');

  const activeQueueCount = waitingCheckIns.length;
  const inChairCount = inChairCheckIns.length;
  const completedTodayCount = completedTodayCheckIns.length;

  // Helper to format dates of backed up or current rent cycles (clean, uncrowded)
  const getCycleDates = (barberItem: Barber, weeksCount: number): string => {
    if (weeksCount <= 0) {
      if (barberItem.rentStartDate) {
        const parts = barberItem.rentStartDate.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          return `Starts ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
      }
      return 'None due';
    }

    const isMonthly = barberItem.rentCycle === 'monthly';
    const now = new Date();

    if (isMonthly) {
      if (weeksCount === 1) {
        return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      const months: string[] = [];
      for (let i = weeksCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      return months.join(' • ');
    }

    // Weekly cycle (Monday to Sunday)
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - diffToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const formatMD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (weeksCount === 1) {
      const end = new Date(currentWeekStart);
      end.setDate(currentWeekStart.getDate() + 6);
      return `${formatMD(currentWeekStart)} – ${formatMD(end)}`;
    }

    if (weeksCount <= 3) {
      const parts: string[] = [];
      for (let i = weeksCount - 1; i >= 0; i--) {
        const s = new Date(currentWeekStart);
        s.setDate(currentWeekStart.getDate() - (i * 7));
        const e = new Date(s);
        e.setDate(s.getDate() + 6);
        if (s.getMonth() === e.getMonth()) {
          parts.push(`${formatMD(s)}–${e.getDate()}`);
        } else {
          parts.push(`${formatMD(s)}–${formatMD(e)}`);
        }
      }
      return parts.join(' • ');
    }

    const earliest = new Date(currentWeekStart);
    earliest.setDate(currentWeekStart.getDate() - ((weeksCount - 1) * 7));
    const latestEnd = new Date(currentWeekStart);
    latestEnd.setDate(currentWeekStart.getDate() + 6);
    return `${formatMD(earliest)} – ${formatMD(latestEnd)} (${weeksCount} wks)`;
  };

  // Current calendar week label (e.g. "Oct 12–18")
  const currentWeekLabel = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - diffToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);

    const formatMD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (currentWeekStart.getMonth() === end.getMonth()) {
      return `${formatMD(currentWeekStart)}–${end.getDate()}`;
    }
    return `${formatMD(currentWeekStart)} – ${formatMD(end)}`;
  }, []);

  // Receipt History Filtering State
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Rent Calculations for Current Period & Multi-Week Arrears
  const activeBarbers = barbers.filter(b => b.isWorking);

  // Group rent payment status and cumulative weeks owed per barber
  const barberPaymentStatus = activeBarbers.map((barber) => {
    const weeklyRate = barber.weeklyRent || config.defaultWeeklyRent || 200;
    const latestPayment = rentRecords.find(r => r.barberId === barber.id && r.status === 'paid');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isUpcoming = false;
    let startDateObj: Date | null = null;
    if (barber.rentStartDate) {
      const parts = barber.rentStartDate.split('-');
      if (parts.length === 3) {
        startDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
        if (startDateObj > today) {
          isUpcoming = true;
        }
      }
    }

    let weeksOwed: number;
    if (isUpcoming) {
      weeksOwed = 0;
    } else if (typeof barber.weeksOwed === 'number') {
      weeksOwed = barber.weeksOwed;
    } else {
      if (latestPayment) {
        const paidDate = new Date(latestPayment.paidAt || latestPayment.dueDate);
        const days = Math.floor((Date.now() - paidDate.getTime()) / (1000 * 60 * 60 * 24));
        weeksOwed = days < 7 ? 0 : Math.max(1, Math.floor(days / 7));
      } else {
        weeksOwed = 1;
      }
    }

    // Safety check: for started barbers, weeks owed cannot exceed elapsed weekly cycles since start date
    if (startDateObj && !isUpcoming && barber.rentCycle !== 'monthly') {
      const day = today.getDay();
      const diffToMonday = (day + 6) % 7;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - diffToMonday);

      const startDay = startDateObj.getDay();
      const diffStartToMonday = (startDay + 6) % 7;
      const startMonday = new Date(startDateObj);
      startMonday.setDate(startDateObj.getDate() - diffStartToMonday);

      const maxElapsed = Math.max(1, Math.round((currentMonday.getTime() - startMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
      if (weeksOwed > maxElapsed) {
        weeksOwed = maxElapsed;
      }
    }

    const isPaid = !isUpcoming && weeksOwed === 0;
    const totalOwed = isUpcoming ? 0 : weeksOwed * weeklyRate;

    return {
      barber,
      isPaid,
      isUpcoming,
      startDateObj,
      weeksOwed,
      totalOwed,
      latestPayment,
      weeklyRate,
      amount: weeklyRate
    };
  });

  const totalExpectedRent = barberPaymentStatus
    .filter(b => !b.isUpcoming)
    .reduce((sum, b) => sum + b.weeklyRate, 0);

  const totalCollected = rentRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalOutstanding = barberPaymentStatus.reduce((sum, b) => sum + b.totalOwed, 0);
  const totalOverdueWeeks = barberPaymentStatus.reduce((sum, b) => sum + b.weeksOwed, 0);
  const collectionRate = totalExpectedRent > 0 ? Math.round((totalCollected / totalExpectedRent) * 100) : 0;

  const upcomingCount = barberPaymentStatus.filter(b => b.isUpcoming).length;
  const paidCount = barberPaymentStatus.filter(b => b.isPaid).length;
  const dueCount = barberPaymentStatus.filter(b => !b.isPaid && !b.isUpcoming).length;
  const backedUpCount = barberPaymentStatus.filter(b => !b.isUpcoming && b.weeksOwed > 1).length;
  const allCount = barberPaymentStatus.length;

  const filteredBarberPaymentStatus = barberPaymentStatus.filter(item => {
    if (rentFilter === 'paid') return item.isPaid;
    if (rentFilter === 'due') return !item.isPaid && !item.isUpcoming;
    if (rentFilter === 'upcoming') return item.isUpcoming;
    return true;
  });

  const handleOpenRecordOffline = (barber: Barber) => {
    const status = barberPaymentStatus.find(s => s.barber.id === barber.id);
    const owed = status?.weeksOwed ?? 1;
    const weeklyRate = barber.weeklyRent || config.defaultWeeklyRent || 200;
    setSelectedBarberForCash(barber);
    setCashWeeksToPay(owed > 0 ? owed : 1);
    setCashPayOption(owed > 1 ? 'all' : 'one');
    setCashCustomAmount(String((owed > 0 ? owed : 1) * weeklyRate));
    setCashPaymentMethod('manual');
    setCashNotes('');
  };

  const handleRecordOfflinePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberForCash) return;
    const barberStatus = barberPaymentStatus.find(b => b.barber.id === selectedBarberForCash.id);
    const weeklyRate = selectedBarberForCash.weeklyRent || config.defaultWeeklyRent || 200;
    
    let finalAmount: number;
    let weeksDeducted: number;

    if (cashPayOption === 'custom') {
      finalAmount = parseFloat(cashCustomAmount) || weeklyRate;
      weeksDeducted = Math.max(1, Math.round(finalAmount / weeklyRate));
    } else if (cashPayOption === 'all') {
      const owed = barberStatus?.weeksOwed || 1;
      weeksDeducted = owed;
      finalAmount = weeklyRate * owed;
    } else {
      weeksDeducted = cashWeeksToPay || 1;
      finalAmount = weeklyRate * weeksDeducted;
    }

    onMarkPaidOffline(selectedBarberForCash, cashPaymentMethod, cashNotes, finalAmount, weeksDeducted);
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
    const status = barberPaymentStatus.find(b => b.barber.id === barber.id);
    const owed = status?.weeksOwed || 1;
    const total = status?.totalOwed || (barber.weeklyRent || 200);
    setReminderSentFor(`${barber.name} ($${total} — ${owed} wk${owed > 1 ? 's' : ''} overdue)`);
    setTimeout(() => setReminderSentFor(null), 3500);
  };

  const handleExportCSV = () => {
    const recordsToExport = filteredRentRecords.length > 0 ? filteredRentRecords : rentRecords;
    const headers = ['Receipt #,Barber Name,Amount,Fee,Total,Status,Method,Date,Notes\n'];
    const rows = recordsToExport.map(r => 
      `"${r.receiptNumber}","${r.barberName}",$${r.amount},$${r.processingFee || 0},$${r.totalPaid},"${r.status}","${r.paymentMethod || 'Card'}","${r.paidAt || r.dueDate}","${r.notes || ''}"`
    );
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = selectedMonth !== 'all' ? selectedMonth : 'all-time';
    a.download = `booth-rent-ledger-${suffix}.csv`;
    a.click();
  };

  // Extract unique months from rentRecords (format: "YYYY-MM")
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentMonthKey);

    rentRecords.forEach((r) => {
      const dateStr = r.paidAt || r.dueDate;
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthSet.add(key);
          }
        } catch {
          // ignore invalid
        }
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [rentRecords]);

  const formatMonthLabel = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  // Filtered payment receipts
  const filteredRentRecords = useMemo(() => {
    return rentRecords.filter((record) => {
      // Month match
      if (selectedMonth !== 'all') {
        const dateStr = record.paidAt || record.dueDate;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== selectedMonth) return false;
      }

      // Barber match
      if (selectedBarberFilter !== 'all' && record.barberId !== selectedBarberFilter) {
        return false;
      }

      // Search query (receipt #, barber name, or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = record.barberName.toLowerCase().includes(q);
        const matchesReceipt = record.receiptNumber.toLowerCase().includes(q);
        const matchesNotes = (record.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesReceipt && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [rentRecords, selectedMonth, selectedBarberFilter, searchQuery]);

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--pastel-green)', fontWeight: 700 }}>
              {collectionRate}% collected
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 650, whiteSpace: 'nowrap' }}>
              Week: {currentWeekLabel}
            </span>
          </div>
        </div>

        {/* Metric 2: Outstanding Balance */}
        <div style={{ background: 'var(--surface-card)', padding: '18px 20px', borderRadius: 20, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unpaid / Due</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: totalOutstanding > 0 ? 'var(--pastel-red-bg)' : 'var(--pastel-green-bg)', color: totalOutstanding > 0 ? 'var(--pastel-red)' : 'var(--pastel-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: totalOutstanding > 0 ? 'var(--pastel-red)' : 'var(--text-primary)' }}>
            ${totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 3 }}>
            {dueCount} barbers pending ({totalOverdueWeeks} total cycles overdue)
          </div>
        </div>

        {/* Metric 3: Active Walk-Ins */}
        <div 
          onClick={() => setIsLiveQueueModalOpen(true)}
          style={{ 
            background: 'var(--surface-card)', 
            padding: '18px 20px', 
            borderRadius: 20, 
            border: activeQueueCount > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-subtle)', 
            boxShadow: activeQueueCount > 0 ? '0 4px 20px rgba(245, 158, 11, 0.12)' : 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          title="Click to view live walk-in line & lobby queue"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Walk-Ins</span>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 10, 
              background: activeQueueCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--surface-pill)', 
              color: activeQueueCount > 0 ? 'var(--accent-primary, #F59E0B)' : 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: activeQueueCount > 0 ? 'var(--accent-primary, #F59E0B)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{activeQueueCount}</span>
            {activeQueueCount > 0 && (
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
                display: 'inline-block'
              }} />
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{activeQueueCount === 1 ? '1 client in lobby' : `${activeQueueCount} in lobby`}</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 750 }}>View Line →</span>
          </div>
        </div>
      </div>

      {/* 2. Barbers Station Rent Roster Grid */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 24, padding: '20px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              Barber Rent Status
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Track payments, record offline cash/Zelle, and adjust rent fees
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
                {dueCount}{backedUpCount > 0 ? ` (${backedUpCount} late)` : ''}
              </span>
            </button>

            {upcomingCount > 0 && (
              <button
                type="button"
                onClick={() => setRentFilter('upcoming')}
                style={{
                  background: rentFilter === 'upcoming' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: rentFilter === 'upcoming' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
                  color: rentFilter === 'upcoming' ? '#60A5FA' : 'var(--text-muted, #71717A)',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: rentFilter === 'upcoming' ? 850 : 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Upcoming</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    background: rentFilter === 'upcoming' ? 'rgba(59, 130, 246, 0.25)' : 'var(--surface-card-subtle)',
                    color: rentFilter === 'upcoming' ? '#60A5FA' : 'var(--text-muted)',
                    fontWeight: 800
                  }}
                >
                  {upcomingCount}
                </span>
              </button>
            )}
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
              {rentFilter === 'due' ? '🎉' : rentFilter === 'upcoming' ? '🗓️' : '📋'}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
              {rentFilter === 'due' 
                ? 'No Rent Outstanding' 
                : rentFilter === 'paid' 
                ? 'No Payments Recorded Yet' 
                : rentFilter === 'upcoming'
                ? 'No Upcoming Barbers'
                : 'No Barbers Found'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {rentFilter === 'due' 
                ? 'All working barbers have paid their booth rent for this cycle!' 
                : rentFilter === 'paid'
                ? 'No barbers have marked their rent as paid for this cycle yet.'
                : rentFilter === 'upcoming'
                ? 'All active barbers have already started their rent cycles.'
                : 'No active barbers currently in shop.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
            {filteredBarberPaymentStatus.map(({ barber, isPaid, isUpcoming, startDateObj, weeksOwed, totalOwed, latestPayment, weeklyRate }) => (
            <div
              key={barber.id}
              style={{
                background: 'var(--surface-pill)',
                border: isUpcoming
                  ? '1px solid var(--border-subtle)'
                  : isPaid 
                  ? '1px solid var(--border-subtle)' 
                  : weeksOwed > 1 
                  ? '1.5px solid var(--pastel-red)' 
                  : '1.5px solid var(--pastel-amber-border, rgba(245, 158, 11, 0.4))',
                borderRadius: 18,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                position: 'relative'
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
                      ${weeklyRate} / week
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: 9999,
                    fontSize: '0.75rem',
                    fontWeight: 850,
                    background: isUpcoming
                      ? 'rgba(59, 130, 246, 0.12)'
                      : isPaid 
                      ? 'var(--pastel-green-bg)' 
                      : weeksOwed > 1 
                      ? 'var(--pastel-red-bg)' 
                      : 'var(--pastel-amber-bg)',
                    color: isUpcoming
                      ? '#60A5FA'
                      : isPaid 
                      ? 'var(--pastel-green)' 
                      : weeksOwed > 1 
                      ? 'var(--pastel-red)' 
                      : 'var(--pastel-amber)',
                    border: isUpcoming
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : isPaid 
                      ? '1px solid var(--pastel-green-border)' 
                      : weeksOwed > 1 
                      ? '1.5px solid var(--pastel-red-border)' 
                      : '1px solid var(--pastel-amber-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isUpcoming ? (
                    <>
                      <Calendar size={12} />
                      <span>Starts {startDateObj ? startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : barber.rentStartDate}</span>
                    </>
                  ) : isPaid ? (
                    <span>Paid</span>
                  ) : weeksOwed > 1 ? (
                    <>
                      <AlertTriangle size={12} />
                      <span>{weeksOwed} Wks Past Due</span>
                    </>
                  ) : (
                    <span>1 Wk Due</span>
                  )}
                </span>
              </div>

              {isUpcoming ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--surface-card)', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>Scheduled to Start</strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#60A5FA' }}>No Rent Due Yet</span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    First billing cycle begins {startDateObj ? startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : barber.rentStartDate} (${weeklyRate}/{barber.rentCycle === 'monthly' ? 'mo' : 'wk'})
                  </div>
                </div>
              ) : isPaid ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--surface-card)', padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                  Paid via <strong>{latestPayment?.paymentMethod === 'apple_pay' ? 'Apple Pay' : latestPayment?.paymentMethod?.toUpperCase() || 'STRIPE'}</strong> • {new Date(latestPayment?.paidAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ) : weeksOwed > 1 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--pastel-red)', background: 'rgba(239, 68, 68, 0.12)', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--pastel-red-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>${totalOwed.toLocaleString()}.00 Total Due</strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pastel-red)' }}>{weeksOwed} Weeks Overdue</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      Cycles: {getCycleDates(barber, weeksOwed)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                      ${weeklyRate}/wk
                    </span>
                  </div>
                  {latestPayment && (
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', borderTop: '1px dashed rgba(239, 68, 68, 0.25)', paddingTop: 3, marginTop: 1 }}>
                      Last paid: {new Date(latestPayment.paidAt || latestPayment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${latestPayment.amount})
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--pastel-amber)', background: 'var(--pastel-amber-bg)', padding: '8px 11px', borderRadius: 11, border: '1px solid var(--pastel-amber-border)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>${weeklyRate}.00 Due</strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--pastel-amber)' }}>Current Cycle</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      Cycle: {getCycleDates(barber, 1)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                      ${weeklyRate}/wk
                    </span>
                  </div>
                  {latestPayment && (
                    <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', borderTop: '1px dashed rgba(245, 158, 11, 0.25)', paddingTop: 3, marginTop: 1 }}>
                      Last paid: {new Date(latestPayment.paidAt || latestPayment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${latestPayment.amount})
                    </div>
                  )}
                </div>
              )}

              {/* Owner Action Buttons for this Barber */}
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                {!isPaid && !isUpcoming && (
                  <button
                    onClick={() => handleOpenRecordOffline(barber)}
                    className="choice-card-action-btn"
                    style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: 9999, flex: 1.5 }}
                  >
                    <DollarSign size={13} />
                    <span>{weeksOwed > 1 ? 'Record Catch-Up' : 'Record Paid'}</span>
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
                  style={{ padding: '7px 12px', fontSize: '0.78rem', flex: isUpcoming ? 1 : undefined, justifyContent: isUpcoming ? 'center' : undefined }}
                >
                  <span>Edit Rate</span>
                </button>

                {!isPaid && !isUpcoming && (
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

          {/* Offline Payment Form */}
          {(() => {
            const barberStatus = barberPaymentStatus.find(s => s.barber.id === selectedBarberForCash.id);
            const owedWeeks = barberStatus?.weeksOwed || 1;
            const weeklyRate = selectedBarberForCash.weeklyRent || config.defaultWeeklyRent || 200;
            const fullArrears = weeklyRate * owedWeeks;
            const activePayAmount = cashPayOption === 'custom' 
              ? (parseFloat(cashCustomAmount) || 0)
              : cashPayOption === 'all'
              ? fullArrears
              : weeklyRate;
            const remainingOverdue = Math.max(0, owedWeeks - (cashPayOption === 'all' ? owedWeeks : 1));

            return (
              <form onSubmit={handleRecordOfflinePayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Backed up notice in modal */}
                {owedWeeks > 1 && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid var(--pastel-red-border)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <AlertTriangle size={18} color="var(--pastel-red)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--pastel-red)' }}>{barberStatus?.barber.name} is {owedWeeks} weeks behind</strong> (${fullArrears.toLocaleString()} total back rent • {barberStatus ? getCycleDates(barberStatus.barber, owedWeeks) : ''}).
                    </div>
                  </div>
                )}

                {/* Catch-Up Option Buttons if > 1 week */}
                {owedWeeks > 1 && (
                  <div>
                    <label className="form-label">Payment Scope</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCashPayOption('all');
                          setCashWeeksToPay(owedWeeks);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: cashPayOption === 'all' ? '2px solid var(--pastel-green)' : '1px solid var(--border-subtle)',
                          background: cashPayOption === 'all' ? 'var(--pastel-green-bg)' : 'var(--surface-pill)',
                          color: cashPayOption === 'all' ? 'var(--pastel-green)' : 'var(--text-primary)',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>Pay All Back Rent</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 2 }}>
                          ${fullArrears} ({owedWeeks} Weeks)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCashPayOption('one');
                          setCashWeeksToPay(1);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: cashPayOption === 'one' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          background: cashPayOption === 'one' ? 'var(--surface-card)' : 'var(--surface-pill)',
                          color: cashPayOption === 'one' ? 'var(--accent-primary)' : 'var(--text-primary)',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>Pay 1 Week</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 2 }}>
                          ${weeklyRate} (Leaves {owedWeeks - 1} due)
                        </div>
                      </button>
                    </div>
                  </div>
                )}

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
                        {m === 'manual' ? 'Cash / Manual' : m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Amount Paid ($)</label>
                    {owedWeeks > 1 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {cashPayOption === 'all' ? `Clears all ${owedWeeks} weeks` : `Clears 1 week (${remainingOverdue} remaining)`}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    disabled={cashPayOption !== 'custom'}
                    value={activePayAmount}
                    onChange={(e) => setCashCustomAmount(e.target.value)}
                    className="bubbly-input"
                  />
                </div>

                <div>
                  <label className="form-label">Notes / Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. In-person cash to owner / Zelle"
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
                    <span>Confirm Paid (${activePayAmount})</span>
                  </button>
                </div>
              </form>
            );
          })()}
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
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
            Payment History & Receipts
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Complete audit trail of all rent receipts and transactions
          </p>
        </div>

        {/* Receipts Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 16,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
            {/* Month Filter Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '6px 12px'
              }}
            >
              <Calendar size={14} style={{ color: 'var(--accent-primary)' }} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all" style={{ background: '#18181B', color: '#FFFFFF' }}>All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m} style={{ background: '#18181B', color: '#FFFFFF' }}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Barber Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '6px 12px'
              }}
            >
              <Filter size={13} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedBarberFilter}
                onChange={(e) => setSelectedBarberFilter(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all" style={{ background: '#18181B', color: '#FFFFFF' }}>All Barbers</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id} style={{ background: '#18181B', color: '#FFFFFF' }}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-pill)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '6px 12px',
                flex: 1,
                minWidth: 160,
                maxWidth: 240
              }}
            >
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search receipt #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Reset Filters Button if any active */}
            {(selectedMonth !== 'all' || selectedBarberFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth('all');
                  setSelectedBarberFilter('all');
                  setSearchQuery('');
                }}
                className="back-pill-btn"
                style={{ padding: '6px 10px', fontSize: '0.76rem', color: 'var(--pastel-red)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredRentRecords.length === 0 ? (
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
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🧾</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
              No Receipts Found
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              No payments match your current month or search criteria.
            </div>
          </div>
        ) : (
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
                {filteredRentRecords.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 750, color: 'var(--text-primary)' }}>{r.receiptNumber}</td>
                    <td>
                      <strong>{r.barberName}</strong>
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
        )}

        {/* Bottom Actions: Export CSV */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleExportCSV}
            className="back-pill-btn"
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Export payment records to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Live Walk-In Line & Lobby Queue Modal */}
      {isLiveQueueModalOpen && (
        <ModalOverlay onClose={() => setIsLiveQueueModalOpen(false)}>
          <div style={{ maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Active Walk-In Line</span>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                    display: 'inline-block'
                  }} />
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                  Live view of customers waiting in the lobby & stations
                </p>
              </div>
              <button
                onClick={() => setIsLiveQueueModalOpen(false)}
                style={{
                  background: 'var(--surface-pill, #27272A)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Stats Pill Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ background: 'var(--surface-pill, #27272A)', padding: '10px 8px', borderRadius: 14, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-primary, #F59E0B)' }}>{activeQueueCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>In Lobby</div>
              </div>
              <div style={{ background: 'var(--surface-pill, #27272A)', padding: '10px 8px', borderRadius: 14, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>{inChairCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>In Service</div>
              </div>
              <div style={{ background: 'var(--surface-pill, #27272A)', padding: '10px 8px', borderRadius: 14, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>{completedTodayCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Done Today</div>
              </div>
            </div>

            {/* In Service (Chairs) Section */}
            {inChairCount > 0 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', margin: '0 0 8px' }}>
                  Currently Cutting ({inChairCount})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {inChairCheckIns.map(client => (
                    <div
                      key={client.id}
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {client.clientName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {client.barberName ? `With ${client.barberName}` : 'In Service'} • {client.type === 'walkin' ? 'Walk-In' : 'Appointment'}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: '#10B981', color: '#000000', padding: '3px 8px', borderRadius: 9999, fontWeight: 900 }}>
                        In Chair
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lobby Waiting Queue */}
            <div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Lobby Waiting ({activeQueueCount})
              </h4>
              {activeQueueCount === 0 ? (
                <div style={{ background: 'var(--surface-pill, #27272A)', borderRadius: 14, padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  No walk-in clients waiting in the lobby right now.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {waitingCheckIns.map((client, idx) => (
                    <div
                      key={client.id}
                      style={{
                        background: 'var(--surface-card, #18181B)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 14,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: idx === 0 ? 'var(--accent-primary)' : 'var(--surface-pill)', color: idx === 0 ? '#000000' : 'var(--text-primary)' }}>
                            #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 850, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {client.clientName}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {client.barberName ? `For ${client.barberName}` : 'Any Available Barber'} • Arrived {new Date(client.checkInTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          {client.clientPhone && ` • ${client.clientPhone}`}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        Waiting
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsLiveQueueModalOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                border: 'none',
                background: 'var(--accent-primary, #F59E0B)',
                color: '#000000',
                fontWeight: 850,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};
