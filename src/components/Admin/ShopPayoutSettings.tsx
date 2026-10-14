import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  DollarSign, 
  Save, 
  Check,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import type { ShopConfig } from '../../types';
import { convexClient } from '../../utils/convexClient';
import { api } from '../../../convex/_generated/api';

interface ShopPayoutSettingsProps {
  config: ShopConfig;
  onSaveConfig: (config: ShopConfig) => void;
}

export const ShopPayoutSettings: React.FC<ShopPayoutSettingsProps> = ({
  config,
  onSaveConfig
}) => {
  // Real values without misleading hardcoded demo placeholders
  const [stripeAccountId, setStripeAccountId] = useState(config.stripeAccountId || '');
  const [stripeSecretKey, setStripeSecretKey] = useState(config.stripeSecretKey || '');
  const [stripePublishableKey, setStripePublishableKey] = useState(config.stripePublishableKey || '');
  const stripeLiveMode = config.stripeLiveMode ?? true;
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [payoutBankName, setPayoutBankName] = useState(config.payoutBankName || '');
  const [payoutSchedule, setPayoutSchedule] = useState<'instant' | 'daily' | 'weekly'>(config.payoutSchedule || 'daily');
  
  const [payoutStatus, setPayoutStatus] = useState<'connected' | 'pending' | 'unlinked'>(
    config.payoutStatus || (config.stripeAccountId ? 'connected' : 'unlinked')
  );
  const [passFeesToBarber, setPassFeesToBarber] = useState(config.passFeesToBarber !== false);
  const [defaultRent, setDefaultRent] = useState(config.defaultWeeklyRent || 250);
  const [rentDueDay, setRentDueDay] = useState(config.defaultRentDueDay || 'Monday');
  const [isSaved, setIsSaved] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [needsConnectSignup, setNeedsConnectSignup] = useState(false);
  const [showAdvancedGateway, setShowAdvancedGateway] = useState(Boolean(config.stripeSecretKey));
  const [isEditingBankName, setIsEditingBankName] = useState(false);

  const isConnected = payoutStatus === 'connected' || Boolean(config.stripeAccountId);

  // Auto-sync live Stripe bank status on mount
  React.useEffect(() => {
    if (config.stripeAccountId && convexClient) {
      convexClient.action(api.stripe.getConnectedAccountStatus, {
        accountId: config.stripeAccountId,
        customSecretKey: config.stripeSecretKey
      }).then(res => {
        if (res.success && res.connected) {
          setPayoutStatus('connected');
          if (res.bankName && !payoutBankName) {
            setPayoutBankName(res.bankName);
          }
        }
      }).catch(err => {
        console.warn('Auto-sync connected account status error:', err);
      });
    }
  }, [config.stripeAccountId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      stripeAccountId: stripeAccountId.trim(),
      stripeSecretKey: stripeSecretKey.trim(),
      stripePublishableKey: stripePublishableKey.trim(),
      stripeLiveMode,
      payoutBankName: payoutBankName.trim(),
      payoutSchedule,
      payoutStatus,
      passFeesToBarber,
      defaultWeeklyRent: defaultRent,
      defaultRentDueDay: rentDueDay,
      stripeConnectActive: isConnected
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    setConnectError(null);
    setNeedsConnectSignup(false);

    if (!convexClient) {
      setConnectError('Cloud connection is initializing... Please refresh and try again.');
      setIsConnectingStripe(false);
      return;
    }

    try {
      const origin = window.location.origin;
      const currentShopSlug = new URLSearchParams(window.location.search).get('shop') || 'of';
      const returnUrl = `${origin}/?shop=${currentShopSlug}&portal=admin&tab=payouts&connect=success`;
      const refreshUrl = `${origin}/?shop=${currentShopSlug}&portal=admin&tab=payouts&connect=refresh`;

      const res = await convexClient.action(api.stripe.createConnectAccountLink, {
        shopSlug: currentShopSlug,
        shopName: config.shopName || 'Barbershop',
        existingAccountId: stripeAccountId || undefined,
        returnUrl,
        refreshUrl,
        customSecretKey: stripeSecretKey || undefined
      });

      if (res.success && res.url) {
        // Redirect browser straight to Stripe's secure bank linking page
        window.location.assign(res.url);
        return;
      } else {
        setConnectError(res.error || 'Failed to initialize Stripe bank onboarding.');
        setNeedsConnectSignup(Boolean(res.needsConnectSignup));
        setIsConnectingStripe(false);
      }
    } catch (err: any) {
      console.error('Error starting Stripe Connect onboarding:', err);
      const msg = err?.message || 'Error communicating with Stripe Connect.';
      setConnectError(msg);
      if (msg.includes('Connect') || msg.includes('signed up for Connect')) {
        setNeedsConnectSignup(true);
      }
      setIsConnectingStripe(false);
    }
  };

  const handleDisconnectBank = () => {
    setPayoutStatus('unlinked');
    setPayoutBankName('');
    setStripeAccountId('');
    setConnectError(null);
  };

  return (
    <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        
        {/* CARD 1: Direct Deposit Bank Payout Destination */}
        <div 
          style={{
            background: 'var(--surface-card, #18181B)',
            border: isConnected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 22,
            padding: '22px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div 
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isConnected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                  color: isConnected ? '#10B981' : '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                    Direct Deposit (Rent Payouts)
                  </h3>
                  <span 
                    style={{
                      background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isConnected ? '#10B981' : '#F59E0B',
                      border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                      borderRadius: 9999,
                      padding: '2px 9px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}
                  >
                    {isConnected ? '✓ Payouts Active' : 'No Bank Linked Yet'}
                  </span>
                </div>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                  The bank account where booth rent paid by your barbers is deposited.
                </p>
              </div>
            </div>

            {/* Status / Connect Action */}
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnectBank}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '6px 12px',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Unlink Account
              </button>
            ) : null}
          </div>

          {isConnected ? (
            /* Connected Bank Info View */
            <div 
              style={{
                background: 'var(--surface-pill, #27272A)',
                borderRadius: 16,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={26} color="#10B981" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.94rem', fontWeight: 850, color: 'var(--text-primary)' }}>
                      {payoutBankName || 'Connected Direct Deposit Account'}
                    </span>
                    {!isEditingBankName && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBankName(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.74rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Edit Label
                      </button>
                    )}
                  </div>
                  {isEditingBankName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <input
                        type="text"
                        value={payoutBankName}
                        onChange={e => setPayoutBankName(e.target.value)}
                        placeholder="e.g. Chase Business (•••• 1234)"
                        className="bubbly-input"
                        style={{ fontSize: '0.78rem', padding: '4px 8px', maxWidth: 220 }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingBankName(false)}
                        style={{ background: 'var(--accent-primary)', border: 'none', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Schedule: <strong style={{ color: 'var(--text-secondary)' }}>Daily automatic payouts</strong> directly to this bank account
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  value={payoutSchedule}
                  onChange={e => setPayoutSchedule(e.target.value as any)}
                  className="bubbly-input"
                  style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                >
                  <option value="daily">Daily Automatic Payouts</option>
                  <option value="weekly">Weekly on Mondays</option>
                  <option value="instant">Instant Card Payouts</option>
                </select>
              </div>
            </div>
          ) : (
            /* Unlinked State: Simple, Clear Setup Call-to-Action */
            <div 
              style={{
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1.5px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: 18,
                padding: '20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ maxWidth: 440 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 850, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Connect Your Payout Bank Account
                </div>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Link your business checking account or debit card. When barbers pay weekly rent, money deposits automatically into your account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={isConnectingStripe}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 14,
                  background: 'var(--accent-primary, #F59E0B)',
                  color: '#000000',
                  border: 'none',
                  fontSize: '0.90rem',
                  fontWeight: 900,
                  cursor: isConnectingStripe ? 'wait' : 'pointer',
                  boxShadow: '0 4px 18px rgba(245, 158, 11, 0.25)'
                }}
              >
                <CreditCard size={17} />
                <span>{isConnectingStripe ? 'Connecting to Stripe...' : 'Connect Bank Account with Stripe'}</span>
              </button>

              {needsConnectSignup && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxWidth: 460
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B', fontWeight: 800, fontSize: '0.86rem' }}>
                    <AlertCircle size={16} />
                    <span>One-Time Action: Enable Stripe Connect</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Your Stripe live account requires <strong>Connect</strong> to be enabled so you can direct-deposit rent into shop owners' bank accounts. Click below to activate it in 30 seconds:
                  </p>
                  <a
                    href="https://dashboard.stripe.com/connect"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--accent-primary, #F59E0B)',
                      color: '#000000',
                      padding: '9px 16px',
                      borderRadius: 10,
                      fontWeight: 850,
                      fontSize: '0.80rem',
                      textDecoration: 'none',
                      width: 'fit-content',
                      marginTop: 2
                    }}
                  >
                    <span>Open dashboard.stripe.com/connect</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {!needsConnectSignup && connectError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  maxWidth: 440
                }}>
                  {connectError}
                </div>
              )}

              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} color="#10B981" /> 256-bit encrypted • Stripe Direct Deposit
              </span>
            </div>
          )}
        </div>

        {/* CARD 2: Shop Rent Rules & Fee Pass-Through */}
        <div 
          style={{
            background: 'var(--surface-card, #18181B)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 22,
            padding: '22px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div 
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                Weekly Rent Rules & Fees
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Default price for new barbers and credit card fee allocation.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 750 }}>
                Default Weekly Booth Rent ($)
              </label>
              <input
                type="number"
                value={defaultRent}
                onChange={e => setDefaultRent(Number(e.target.value))}
                className="bubbly-input"
                style={{ fontSize: '0.90rem', fontWeight: 800 }}
              />
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Applied to new barbers (you can still customize per-barber).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 750 }}>
                Rent Due Day
              </label>
              <select
                value={rentDueDay}
                onChange={e => setRentDueDay(e.target.value)}
                className="bubbly-input"
                style={{ fontSize: '0.88rem', fontWeight: 750 }}
              >
                <option value="Monday">Every Monday</option>
                <option value="Tuesday">Every Tuesday</option>
                <option value="Wednesday">Every Wednesday</option>
                <option value="Thursday">Every Thursday</option>
                <option value="Friday">Every Friday</option>
                <option value="Saturday">Every Saturday</option>
                <option value="Sunday">Every Sunday</option>
              </select>
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                New cycle charges automatically on this day.
              </span>
            </div>
          </div>

          {/* Fee Pass-Through Switch */}
          <div 
            style={{
              background: 'var(--surface-pill, #27272A)',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              cursor: 'pointer'
            }}
            onClick={() => setPassFeesToBarber(!passFeesToBarber)}
          >
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Pass Card Fee (2.9% + 30¢) to Barbers
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {passFeesToBarber 
                  ? '✓ Barbers pay fee at checkout (e.g. $257.55 total) so you receive your full $250.00' 
                  : 'Shop absorbs card fee (fee deducted from your $250.00 base rent)'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={passFeesToBarber}
              onChange={e => setPassFeesToBarber(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* CARD 3: Advanced Developer Stripe Keys (Collapsed by default so it never overwhelms) */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            borderRadius: 18,
            overflow: 'hidden'
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdvancedGateway(!showAdvancedGateway)}
            style={{
              width: '100%',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 750
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={15} color="#A1A1AA" />
              <span>Advanced: Custom Stripe Developer API Keys (Optional)</span>
            </div>
            {showAdvancedGateway ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvancedGateway && (
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Leave empty to use the master platform Stripe integration. Only fill this out if your shop runs on its own independent Stripe developer account.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Custom Secret Key (sk_live_...)</span>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.70rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {showSecretKey ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showSecretKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={stripeSecretKey}
                    onChange={e => setStripeSecretKey(e.target.value)}
                    className="bubbly-input"
                    placeholder="sk_live_..."
                    style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                    Custom Publishable Key (pk_live_...)
                  </label>
                  <input
                    type="text"
                    value={stripePublishableKey}
                    onChange={e => setStripePublishableKey(e.target.value)}
                    className="bubbly-input"
                    placeholder="pk_live_..."
                    style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Changes Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            className="choice-card-action-btn"
            style={{
              padding: '13px 26px',
              borderRadius: 14,
              fontSize: '0.94rem',
              fontWeight: 850,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: 240,
              background: 'var(--accent-primary, #F59E0B)',
              color: '#000000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isSaved ? <Check size={17} /> : <Save size={17} />}
            <span>{isSaved ? 'Settings Saved!' : 'Save Banking Settings'}</span>
          </button>

          {isSaved && (
            <span className="pop-in" style={{ fontSize: '0.84rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={15} /> Payout settings updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
