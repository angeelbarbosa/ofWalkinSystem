import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  ExternalLink, 
  Zap, 
  DollarSign, 
  Save, 
  Check
} from 'lucide-react';
import type { ShopConfig } from '../../types';

interface ShopPayoutSettingsProps {
  config: ShopConfig;
  onSaveConfig: (config: ShopConfig) => void;
}

export const ShopPayoutSettings: React.FC<ShopPayoutSettingsProps> = ({
  config,
  onSaveConfig
}) => {
  const [stripeAccountId, setStripeAccountId] = useState(config.stripeAccountId || 'acct_1OF82937492193');
  const [stripePaymentLink, setStripePaymentLink] = useState(config.stripePaymentLink || '');
  const [payoutBankName, setPayoutBankName] = useState(config.payoutBankName || 'Chase Business Checking (•••• 4821)');
  const [payoutSchedule, setPayoutSchedule] = useState<'instant' | 'daily' | 'weekly'>(config.payoutSchedule || 'daily');
  const [payoutStatus, setPayoutStatus] = useState<'connected' | 'pending' | 'unlinked'>(config.payoutStatus || 'connected');
  const [zellePhone, setZellePhone] = useState(config.zelleRecipientPhone || '(555) 777-1010');
  const [zelleEmail, setZelleEmail] = useState(config.zelleRecipientEmail || 'marcus@fademasters.com');
  const [passFeesToBarber, setPassFeesToBarber] = useState(config.passFeesToBarber !== false);
  const [defaultRent, setDefaultRent] = useState(config.defaultWeeklyRent || 200);
  const [rentDueDay, setRentDueDay] = useState(config.defaultRentDueDay || 'Monday');
  const [isSaved, setIsSaved] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      stripeAccountId,
      stripePaymentLink,
      payoutBankName,
      payoutSchedule,
      payoutStatus,
      zelleRecipientPhone: zellePhone,
      zelleRecipientEmail: zelleEmail,
      passFeesToBarber,
      defaultWeeklyRent: defaultRent,
      defaultRentDueDay: rentDueDay,
      stripeConnectActive: payoutStatus === 'connected'
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSimulateStripeConnect = () => {
    setIsConnectingStripe(true);
    setTimeout(() => {
      setPayoutStatus('connected');
      setStripeAccountId('acct_' + Math.random().toString(36).substring(2, 12));
      setPayoutBankName('Bank of America (•••• ' + Math.floor(1000 + Math.random() * 9000) + ')');
      setIsConnectingStripe(false);
    }, 1200);
  };

  return (
    <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--surface-card, #18181B) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 22,
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'var(--pastel-green, #10B981)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                Payout Banking & Stripe Connect
              </h3>
              <span 
                style={{
                  background: payoutStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: payoutStatus === 'connected' ? '#10B981' : '#F59E0B',
                  border: `1px solid ${payoutStatus === 'connected' ? '#10B981' : '#F59E0B'}`,
                  borderRadius: 9999,
                  padding: '2px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 800
                }}
              >
                {payoutStatus === 'connected' ? '✓ Payouts Active' : 'Setup Required'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Direct deposit destination for weekly booth rent paid by your shop barbers.
            </p>
          </div>
        </div>

        {payoutStatus === 'connected' ? (
          <button
            type="button"
            onClick={handleSimulateStripeConnect}
            disabled={isConnectingStripe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 12,
              background: 'var(--surface-pill, #27272A)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            <ExternalLink size={14} />
            <span>{isConnectingStripe ? 'Updating...' : 'Manage Stripe Express'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSimulateStripeConnect}
            disabled={isConnectingStripe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 12,
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 850,
              cursor: 'pointer'
            }}
          >
            <CreditCard size={15} />
            <span>{isConnectingStripe ? 'Connecting...' : 'Connect Bank with Stripe'}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Section 1: Connected Bank Details */}
        <div 
          style={{
            background: 'var(--surface-card, #18181B)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={18} color="#10B981" />
            <h4 style={{ fontSize: '1rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              Connected Payout Destination
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Bank Account / Institution
              </label>
              <input
                type="text"
                value={payoutBankName}
                onChange={e => setPayoutBankName(e.target.value)}
                className="bubbly-input"
                placeholder="e.g. Chase Business Checking (•••• 4821)"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Stripe Connected Account ID
              </label>
              <input
                type="text"
                value={stripeAccountId}
                onChange={e => setStripeAccountId(e.target.value)}
                className="bubbly-input"
                placeholder="acct_1..."
                style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Payout Schedule
              </label>
              <select
                value={payoutSchedule}
                onChange={e => setPayoutSchedule(e.target.value as any)}
                className="bubbly-input"
              >
                <option value="daily">Daily Automatic Payouts</option>
                <option value="weekly">Weekly on Mondays</option>
                <option value="instant">Instant Debit Card Payouts (1% fee)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Shop Stripe Payment Link & Zelle Direct */}
        <div 
          style={{
            background: 'var(--surface-card, #18181B)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={18} color="#F59E0B" />
            <h4 style={{ fontSize: '1rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              Direct Payment Channels (Stripe & Zelle)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Shop Stripe Payment Link (Optional custom URL for your barbers)
              </label>
              <input
                type="url"
                value={stripePaymentLink}
                onChange={e => setStripePaymentLink(e.target.value)}
                className="bubbly-input"
                placeholder="https://buy.stripe.com/..."
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                If provided, barbers clicking Pay with Card or Apple Pay will be directed to your custom Stripe checkout.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Owner Zelle Phone
              </label>
              <input
                type="tel"
                value={zellePhone}
                onChange={e => setZellePhone(e.target.value)}
                className="bubbly-input"
                placeholder="(555) 777-1010"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Owner Zelle Email
              </label>
              <input
                type="email"
                value={zelleEmail}
                onChange={e => setZelleEmail(e.target.value)}
                className="bubbly-input"
                placeholder="owner@barbershop.com"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Fee Pass-Through & Weekly Rent Defaults */}
        <div 
          style={{
            background: 'var(--surface-card, #18181B)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <DollarSign size={18} color="#10B981" />
            <h4 style={{ fontSize: '1rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
              Rent Rules & Processing Fees
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Default Weekly Booth Rent ($)
              </label>
              <input
                type="number"
                value={defaultRent}
                onChange={e => setDefaultRent(Number(e.target.value))}
                className="bubbly-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Rent Due Day
              </label>
              <select
                value={rentDueDay}
                onChange={e => setRentDueDay(e.target.value)}
                className="bubbly-input"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 750 }}>
                <input
                  type="checkbox"
                  checked={passFeesToBarber}
                  onChange={e => setPassFeesToBarber(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
                />
                <span>Pass Stripe fee (2.9% + 30¢) to Barbers</span>
              </label>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, marginLeft: 28 }}>
                {passFeesToBarber 
                  ? 'Barbers pay $206.10 on card so you receive exactly $200.00' 
                  : 'Shop absorbs card fee ($5.80 fee deducted from $200.00)'}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            className="choice-card-action-btn"
            style={{
              padding: '13px 24px',
              borderRadius: 14,
              fontSize: '0.94rem',
              fontWeight: 850,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: 240
            }}
          >
            {isSaved ? <Check size={17} /> : <Save size={17} />}
            <span>{isSaved ? 'Settings Saved!' : 'Save Banking Settings'}</span>
          </button>

          {isSaved && (
            <span className="pop-in" style={{ fontSize: '0.84rem', color: '#10B981', fontWeight: 800 }}>
              ✓ Payout settings synced across fleet
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
