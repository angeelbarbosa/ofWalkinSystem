import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Users, 
  Scissors, 
  Timer, 
  Sparkles,
  Phone
} from 'lucide-react';
import type { Barber, CheckInRecord, ShopConfig } from '../../types';

interface LiveQueueBoardProps {
  config: ShopConfig;
  barbers: Barber[];
  checkIns: CheckInRecord[];
  onJoinQueue: (clientName: string, selectedBarber?: Barber, clientPhone?: string) => void;
  onBack: () => void;
}

export const LiveQueueBoard: React.FC<LiveQueueBoardProps> = ({
  config,
  barbers,
  checkIns,
  onJoinQueue,
  onBack
}) => {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [preferredBarberId, setPreferredBarberId] = useState<string>('first_available');

  const activeBarbers = barbers.filter(b => b.isWorking);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Active in chair
  const inChairClients = checkIns.filter(c => c.status === 'in_chair');

  // Waiting in queue (Sorted chronologically by check-in time)
  const waitingQueue = checkIns
    .filter(c => c.status === 'waiting' || c.status === 'called')
    .sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());

  // Calculate estimated wait time (~15 mins per waiting client divided by active working barbers)
  const estimatedWaitMins = activeBarbers.length > 0 
    ? Math.max(5, Math.round((waitingQueue.length * 15) / Math.max(1, activeBarbers.length)))
    : 15;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const selectedBarber = preferredBarberId === 'first_available' 
      ? undefined 
      : activeBarbers.find(b => b.id === preferredBarberId);

    onJoinQueue(clientName.trim(), selectedBarber, clientPhone.trim() || undefined);
    setIsJoinModalOpen(false);
    setClientName('');
    setClientPhone('');
  };

  // Helper for relative wait duration
  const getElapsedWait = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins <= 0) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  };

  return (
    <div className="live-queue-container pop-in" style={{ width: '100%', maxWidth: '980px', margin: '0 auto', padding: '0 12px' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="back-pill-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Live Walk-In Queue
              </h2>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                Live Feed
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {config.shopName} • Real-time waiting list & open chair status
            </p>
          </div>
        </div>

        {/* CTA: Tap to Join Line */}
        <button
          onClick={() => setIsJoinModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
            color: '#000000',
            borderRadius: '9999px',
            fontSize: '1rem',
            fontWeight: 850,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
            transition: 'transform 0.2s ease'
          }}
        >
          <Flame size={18} />
          <span>Join the Line Now</span>
        </button>
      </div>

      {/* Quick Status Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Metric 1: In Queue */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '18px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={20} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
              Waiting in Lobby
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {waitingQueue.length} {waitingQueue.length === 1 ? 'Client' : 'Clients'}
            </p>
          </div>
        </div>

        {/* Metric 2: Est Wait */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '18px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Timer size={20} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
              Estimated Wait
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {waitingQueue.length === 0 ? 'Ready Now' : `~${estimatedWaitMins} mins`}
            </p>
          </div>
        </div>

        {/* Metric 3: Active Chairs */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '18px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scissors size={20} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
              Barbers on Duty
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {activeBarbers.length} Stations Active
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Stations (Left) + Queue Line (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Column 1: Live Barber Stations Status */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scissors size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Stations & Chairs on Duty</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeBarbers.map((barber) => {
              const currentCut = inChairClients.find(c => c.barberId === barber.id || c.barberName === barber.name);

              return (
                <div
                  key={barber.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--surface-pill, #27272A)',
                    border: currentCut ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: barber.avatarColor || '#F59E0B',
                      color: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}>
                      #{barber.stationNumber}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {barber.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                        {currentCut ? `Cutting: ${currentCut.clientName}` : 'Chair is open'}
                      </p>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: currentCut ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: currentCut ? '#F59E0B' : '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: currentCut ? '#F59E0B' : '#10B981' }} />
                    {currentCut ? 'In Service' : 'Ready Now'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: The Live Waiting Line Order */}
        <div style={{
          background: 'var(--surface-card, #18181B)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} style={{ color: '#F59E0B' }} />
              <span>Up Next in Line ({waitingQueue.length})</span>
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Ordered by arrival
            </span>
          </div>

          {waitingQueue.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 20px',
              textAlign: 'center',
              background: 'var(--surface-pill, #27272A)',
              borderRadius: '16px',
              border: '1px dashed var(--border-subtle, rgba(255,255,255,0.1))'
            }}>
              <Sparkles size={32} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                No one is waiting right now!
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 16px' }}>
                Walk in and get seated right away in the next open chair.
              </p>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--accent-primary, #F59E0B)',
                  color: '#000',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                + Join as #1 in Line
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '340px' }}>
              {waitingQueue.map((item, index) => {
                const position = index + 1;
                const isNextUp = position === 1;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      background: isNextUp 
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)' 
                        : 'var(--surface-pill, #27272A)',
                      border: isNextUp 
                        ? '2px solid var(--accent-primary, #F59E0B)' 
                        : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                      borderRadius: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: isNextUp ? 'var(--accent-primary, #F59E0B)' : 'rgba(255,255,255,0.1)',
                        color: isNextUp ? '#000000' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '14px'
                      }}>
                        #{position}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {item.clientName}
                          </p>
                          {isNextUp && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#F59E0B',
                              color: '#000',
                              fontWeight: 900
                            }}>
                              NEXT UP
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          {item.barberName ? `Preference: ${item.barberName}` : 'First Available'} • Checked in {getElapsedWait(item.checkInTime)}
                        </p>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isNextUp ? '#F59E0B' : 'var(--text-muted)'
                    }}>
                      {item.status === 'called' ? 'Called' : 'Waiting in Lobby'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Quick 10-Second Join Queue Form */}
      {isJoinModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--surface-card, #18181B)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.2))',
            borderRadius: '28px',
            padding: '28px 24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderRadius: '12px' }}>
                  <Flame size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                    Join the Walk-In Line
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    You'll be added as #{waitingQueue.length + 1} in line
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Your First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'var(--surface-pill, #27272A)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={13} />
                    <span>Phone Number (Optional)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Get notified when ready</span>
                </div>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'var(--surface-pill, #27272A)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Barber Preference (Optional)
                </label>
                <select
                  value={preferredBarberId}
                  onChange={(e) => setPreferredBarberId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--surface-pill, #27272A)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  <option value="first_available">First Available (Shortest Wait)</option>
                  {activeBarbers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'var(--surface-pill, #27272A)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    color: 'var(--text-secondary)',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '14px',
                    background: 'linear-gradient(135deg, var(--accent-primary, #F59E0B) 0%, var(--accent-primary-hover, #D97706) 100%)',
                    color: '#000',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Confirm & Join Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
