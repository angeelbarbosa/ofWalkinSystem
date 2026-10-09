import React, { useState } from 'react';
import { 
  Receipt, 
  Copy, 
  Check, 
  X, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Banknote,
  Search
} from 'lucide-react';
import type { Barber, ShopConfig, RentPaymentRecord } from '../../types';
import { ModalOverlay } from '../Shared/ModalOverlay';

interface BarberReceiptsHistoryModalProps {
  barber: Barber;
  config: ShopConfig;
  rentRecords: RentPaymentRecord[];
  onPayRent?: () => void;
  onClose: () => void;
}

export const BarberReceiptsHistoryModal: React.FC<BarberReceiptsHistoryModalProps> = ({
  barber,
  config,
  rentRecords,
  onPayRent,
  onClose
}) => {
  const [copiedReceipt, setCopiedReceipt] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<RentPaymentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filter all paid records for this barber, newest first
  const myPaidRecords = rentRecords
    .filter(r => r.barberId === barber.id && r.status === 'paid')
    .sort((a, b) => new Date(b.paidAt || b.dueDate).getTime() - new Date(a.paidAt || a.dueDate).getTime());

  // 2. Cumulative weeks owed and weekly rate
  const weeklyRate = barber.weeklyRent || config.defaultWeeklyRent || 200;
  const weeksOwed = typeof barber.weeksOwed === 'number'
    ? barber.weeksOwed
    : (myPaidRecords.length > 0 ? 0 : 1);
  const isPaidCurrentCycle = weeksOwed === 0;
  const totalOutstanding = weeksOwed * weeklyRate;

  // 3. Handle copy receipt number
  const handleCopyReceipt = (num: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedReceipt(num);
    setTimeout(() => setCopiedReceipt(null), 2000);
  };

  // 5. Filter receipts by search (e.g. REC-XXXX, month, or notes)
  const filteredRecords = myPaidRecords.filter(r => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.receiptNumber || '').toLowerCase().includes(term) ||
      (r.periodDescription || '').toLowerCase().includes(term) ||
      (r.paymentMethod || '').toLowerCase().includes(term) ||
      (r.notes || '').toLowerCase().includes(term) ||
      new Date(r.paidAt || r.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase().includes(term)
    );
  });

  const getMethodBadge = (method?: RentPaymentRecord['paymentMethod']) => {
    switch (method) {
      case 'apple_pay':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.08)', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            <CreditCard size={11} style={{ color: '#10B981' }} />
            <span>Apple Pay</span>
          </span>
        );
      case 'card':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(59, 130, 246, 0.12)', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800, color: '#60A5FA' }}>
            <CreditCard size={11} />
            <span>Credit/Debit Card</span>
          </span>
        );
      case 'stripe':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99, 102, 241, 0.12)', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800, color: '#818CF8' }}>
            <CreditCard size={11} />
            <span>Stripe Online</span>
          </span>
        );
      case 'manual':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.12)', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 800, color: '#34D399' }}>
            <Banknote size={11} />
            <span>Cash / In-Person</span>
          </span>
        );
    }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth={540} zIndex={999999}>
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          background: 'var(--surface-card, #121216)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid var(--accent-primary, #F59E0B)',
              color: 'var(--accent-primary, #F59E0B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Receipt size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Paid Rent Receipts
              </h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                {barber.name} • Station #{barber.stationNumber || 1}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-pill, #27272A)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              color: 'var(--text-muted, #71717A)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close Receipts Modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div style={{
          padding: '18px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1
        }}>
          {/* Current Cycle Status Summary Card */}
          <div style={{
            background: isPaidCurrentCycle 
              ? 'rgba(16, 185, 129, 0.08)' 
              : weeksOwed > 1 
              ? 'rgba(239, 68, 68, 0.08)' 
              : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${
              isPaidCurrentCycle 
                ? 'rgba(16, 185, 129, 0.25)' 
                : weeksOwed > 1 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(245, 158, 11, 0.25)'
            }`,
            borderRadius: 18,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isPaidCurrentCycle ? (
                <CheckCircle2 size={24} style={{ color: 'var(--pastel-green, #10B981)', flexShrink: 0 }} />
              ) : weeksOwed > 1 ? (
                <AlertTriangle size={24} style={{ color: 'var(--pastel-red, #EF4444)', flexShrink: 0 }} />
              ) : (
                <Clock size={24} style={{ color: 'var(--pastel-amber, #F59E0B)', flexShrink: 0 }} />
              )}
              <div>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  color: isPaidCurrentCycle 
                    ? 'var(--pastel-green, #10B981)' 
                    : weeksOwed > 1 
                    ? 'var(--pastel-red, #EF4444)' 
                    : 'var(--pastel-amber, #F59E0B)'
                }}>
                  {isPaidCurrentCycle 
                    ? 'Current Cycle Up to Date' 
                    : weeksOwed > 1 
                    ? `🚨 ${weeksOwed} Weeks Past Due ($${totalOutstanding})` 
                    : `Rent Due: $${totalOutstanding}`}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Standard rate: ${weeklyRate}/week (Due {barber.rentDueDay || 'Monday'})
                </div>
              </div>
            </div>

            {!isPaidCurrentCycle && onPayRent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPayRent();
                }}
                style={{
                  background: weeksOwed > 1 ? 'var(--pastel-red, #EF4444)' : 'var(--accent-primary, #F59E0B)',
                  color: weeksOwed > 1 ? '#FFFFFF' : 'var(--bg-main, #000000)',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: '0.78rem',
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span>Pay Rent</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Search / Filter Receipts Bar if there are multiple */}
          {myPaidRecords.length > 2 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-pill, #1C1C21)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              borderRadius: 12,
              padding: '6px 12px'
            }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by receipt # or date..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 650,
                  width: '100%'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Section Heading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 850, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Past Payment History ({filteredRecords.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Verified by Shop
            </span>
          </div>

          {/* List of Paid Receipts */}
          {filteredRecords.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 20px',
              background: 'var(--surface-pill, #1C1C21)',
              border: '1px dashed var(--border-subtle, rgba(255,255,255,0.15))',
              borderRadius: 18
            }}>
              <Receipt size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px', opacity: 0.6 }} />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {searchTerm ? 'No Matching Receipts Found' : 'No Paid Receipts on File Yet'}
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 16px', maxWidth: 300, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
                {searchTerm 
                  ? 'Try searching with a different receipt number or month.'
                  : 'Once your weekly rent is paid via Apple Pay, card, or marked in cash by the owner, your official digital receipts will appear here.'}
              </p>
              {!isPaidCurrentCycle && onPayRent && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPayRent();
                  }}
                  style={{
                    background: 'var(--accent-primary, #F59E0B)',
                    color: 'var(--bg-main, #000)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontSize: '0.8rem',
                    fontWeight: 850,
                    cursor: 'pointer'
                  }}
                >
                  Pay Current Rent (${weeklyRate})
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredRecords.map((receipt) => {
                const paidDate = new Date(receipt.paidAt || receipt.dueDate);
                const isSelected = selectedReceipt?.id === receipt.id;

                return (
                  <div
                    key={receipt.id}
                    onClick={() => setSelectedReceipt(isSelected ? null : receipt)}
                    style={{
                      background: isSelected ? 'rgba(245, 158, 11, 0.05)' : 'var(--surface-card, #18181B)',
                      border: isSelected 
                        ? '1px solid var(--accent-primary, #F59E0B)' 
                        : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                      borderRadius: 16,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    {/* Top Row: Period & Total Paid */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 850, color: 'var(--text-primary)' }}>
                          {receipt.periodDescription || `Week of ${paidDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                          <span>
                            {paidDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--pastel-green, #10B981)' }}>
                          ${(receipt.totalPaid || receipt.amount).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {receipt.feeCoveredByBarber && receipt.processingFee > 0
                            ? `Incl. $${receipt.processingFee.toFixed(2)} fee`
                            : '$0.00 fee'}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Payment Method & Receipt # */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getMethodBadge(receipt.paymentMethod)}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleCopyReceipt(receipt.receiptNumber, e)}
                        style={{
                          background: 'var(--surface-pill, #27272A)',
                          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                          padding: '3px 8px',
                          borderRadius: 6,
                          color: 'var(--text-primary)',
                          fontWeight: 750,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          fontSize: '0.72rem'
                        }}
                        title="Copy Receipt Number"
                      >
                        <span>{receipt.receiptNumber}</span>
                        {copiedReceipt === receipt.receiptNumber ? (
                          <Check size={11} style={{ color: '#10B981' }} />
                        ) : (
                          <Copy size={11} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </button>
                    </div>

                    {/* Optional Notes */}
                    {receipt.notes && (
                      <div style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontStyle: 'italic',
                        marginTop: 2
                      }}>
                        "{receipt.notes}"
                      </div>
                    )}

                    {/* Expanded Digital Receipt Details */}
                    {isSelected && (
                      <div style={{
                        marginTop: 6,
                        paddingTop: 10,
                        borderTop: '1px dashed var(--border-subtle, rgba(255,255,255,0.15))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: '0.76rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Base Booth Rent:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${receipt.amount.toFixed(2)}</span>
                        </div>
                        {receipt.processingFee > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Processing Fee:</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>+${receipt.processingFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Verification Time:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {paidDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--pastel-green, #10B981)', fontSize: '0.72rem', fontWeight: 800, marginTop: 4 }}>
                          <ShieldCheck size={13} />
                          <span>Recorded in Shop Master Ledger</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          background: 'var(--surface-card, #121216)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Digital Receipts • Verified & Stored Forever
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: 'var(--surface-pill, #27272A)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};
