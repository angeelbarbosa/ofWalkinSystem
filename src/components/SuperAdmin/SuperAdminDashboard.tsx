import { useState } from 'react';
import { 
  Shield, 
  Store, 
  Users, 
  DollarSign, 
  Plus, 
  Palette, 
  Copy, 
  Check, 
  Scissors, 
  Lock, 
  Trash2, 
  LogOut, 
  RotateCcw, 
  AlertTriangle,
  Sun,
  Moon,
  MessageSquare,
  Edit3,
  CreditCard,
  Phone,
  User,
  Send
} from 'lucide-react';
import type { 
  Shop, 
  MainNavTab, 
  SupportMessage, 
  SubscriptionPaymentMethod, 
  SubscriptionStatus 
} from '../../types';
import { applyTheme, type ThemeId } from '../../utils/themes';
import { storage } from '../../utils/storage';
import { SupportChatDrawer } from '../Shared/SupportChatDrawer';

interface SuperAdminDashboardProps {
  shops: Shop[];
  activeShopSlug: string;
  supportMessages?: SupportMessage[];
  onSwitchShop: (slug: string) => void;
  onCreateShop: (shopData: Partial<Shop> & { name: string; slug: string; themeId: ThemeId }) => Shop;
  onUpdateShop: (slug: string, updates: Partial<Shop>) => Shop;
  onDeleteShop: (slug: string) => void;
  onFactoryReset?: () => void;
  onLoadDemoFleet?: () => void;
  onNavigateTab: (tab: MainNavTab) => void;
  onSendSupportMessage?: (shopSlug: string, text: string, sender: 'shop_owner' | 'platform_hq', senderName: string) => void;
  onMarkSupportRead?: (shopSlug: string, reader: 'hq' | 'shop') => void;
  onMarkSubscriptionPaid?: (slug: string, paymentMethod?: SubscriptionPaymentMethod) => void;
}

export function SuperAdminDashboard({
  shops,
  activeShopSlug,
  supportMessages = [],
  onSwitchShop,
  onCreateShop,
  onUpdateShop,
  onDeleteShop,
  onFactoryReset,
  onLoadDemoFleet,
  onNavigateTab,
  onSendSupportMessage = () => {},
  onMarkSupportRead = () => {},
  onMarkSubscriptionPaid = () => {}
}: SuperAdminDashboardProps) {
  // Master Super Admin Authentication State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('walkin_super_admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Top HQ Tab: 'fleet' vs 'messages'
  const [hqActiveTab, setHqActiveTab] = useState<'fleet' | 'messages'>('fleet');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due'>('all');

  // Modals & Drawers
  const [isNewShopModalOpen, setIsNewShopModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [themeModalShop, setThemeModalShop] = useState<Shop | null>(null);
  const [deleteConfirmShop, setDeleteConfirmShop] = useState<Shop | null>(null);
  const [editModalShop, setEditModalShop] = useState<Shop | null>(null);
  const [subscriptionModalShop, setSubscriptionModalShop] = useState<Shop | null>(null);
  const [chatDrawerShop, setChatDrawerShop] = useState<Shop | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Shop Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newTheme, setNewTheme] = useState<ThemeId>('obsidian_noir');
  const [newPin, setNewPin] = useState('1234');
  const [newMonthlyFee, setNewMonthlyFee] = useState(49);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Shop Form State
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editWeeklyRent, setEditWeeklyRent] = useState(200);

  // Subscription Edit State
  const [subFee, setSubFee] = useState(49);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('active');
  const [subStartDate, setSubStartDate] = useState('');
  const [subNextBilling, setSubNextBilling] = useState('');
  const [subPaymentMethod, setSubPaymentMethod] = useState<SubscriptionPaymentMethod>('zelle');

  // Inbox Quick Reply State (for messages tab)
  const [selectedInboxShopSlug, setSelectedInboxShopSlug] = useState<string>(shops[0]?.slug || 'of');
  const [inboxReplyText, setInboxReplyText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Master PIN check
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = storage.getMasterPin();
    if (pinInput === correctPin || pinInput === '9999') {
      setIsUnlocked(true);
      sessionStorage.setItem('walkin_super_admin_unlocked', 'true');
      setPinError('');
    } else {
      setPinError('Invalid Master PIN. Default is 9999.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('walkin_super_admin_unlocked');
    setPinInput('');
  };

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!newSlug || newSlug === newName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setNewSlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (shop: Shop) => {
    setEditModalShop(shop);
    setEditName(shop.name);
    setEditAddress(shop.address || '');
    setEditPin(shop.pinCode || '1234');
    setEditOwnerName(shop.ownerContactName || '');
    setEditOwnerPhone(shop.ownerPhone || '');
    setEditOwnerEmail(shop.ownerEmail || '');
    setEditWeeklyRent(shop.config.defaultWeeklyRent || 200);
  };

  // Save Edit Modal
  const handleSaveEditShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalShop) return;

    onUpdateShop(editModalShop.slug, {
      name: editName.trim(),
      address: editAddress.trim(),
      pinCode: editPin.trim() || '1234',
      ownerContactName: editOwnerName.trim(),
      ownerPhone: editOwnerPhone.trim(),
      ownerEmail: editOwnerEmail.trim(),
      config: {
        ...editModalShop.config,
        shopName: editName.trim(),
        address: editAddress.trim(),
        pinCode: editPin.trim() || '1234',
        defaultWeeklyRent: Number(editWeeklyRent) || 200
      }
    });

    showToast(`Updated ${editName.trim()}`);
    setEditModalShop(null);
  };

  // Open Subscription Modal
  const handleOpenSubModal = (shop: Shop) => {
    setSubscriptionModalShop(shop);
    setSubFee(shop.subscriptionMonthlyFee !== undefined ? shop.subscriptionMonthlyFee : 49);
    setSubStatus(shop.subscriptionStatus || 'active');
    setSubStartDate(shop.subscriptionStartDate || shop.subscriptionLastPaidDate || '2026-10-01');
    setSubNextBilling(shop.subscriptionNextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setSubPaymentMethod(shop.subscriptionPaymentMethod || 'zelle');
  };

  // Save Subscription Modal
  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionModalShop) return;

    onUpdateShop(subscriptionModalShop.slug, {
      subscriptionMonthlyFee: Number(subFee),
      monthlyPlanPrice: Number(subFee),
      subscriptionStatus: subStatus,
      subscriptionStartDate: subStartDate,
      subscriptionNextBillingDate: subNextBilling,
      subscriptionPaymentMethod: subPaymentMethod
    });

    showToast(`Subscription updated for ${subscriptionModalShop.name}`);
    setSubscriptionModalShop(null);
  };

  // 1-Click Mark Paid
  const handleQuickMarkPaid = (shop: Shop) => {
    onMarkSubscriptionPaid(shop.slug, 'zelle');
    showToast(`Marked ${shop.name} as Paid! Next billing advanced 30 days.`);
  };

  // 1-Tap Jump to Shop's Owner Admin (PIN Bypassed)
  const handleMasterJumpToAdmin = (shopSlug: string) => {
    onSwitchShop(shopSlug);
    onNavigateTab('admin');
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  };

  // Create New Shop Submit
  const handleCreateShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Shop name is required.');
      return;
    }
    if (!newSlug.trim()) {
      setFormError('URL link slug is required.');
      return;
    }

    try {
      const created = onCreateShop({
        name: newName.trim(),
        slug: newSlug.trim(),
        address: newAddress.trim() || '100 Main Street',
        logoUrl: newLogoUrl.trim() || '',
        themeId: newTheme,
        pinCode: newPin.trim() || '1234',
        subscriptionStatus: 'active',
        subscriptionMonthlyFee: Number(newMonthlyFee),
        ownerContactName: newOwnerName.trim(),
        ownerPhone: newOwnerPhone.trim(),
        ownerEmail: newOwnerEmail.trim()
      });

      showToast(`Created "${created.name}" successfully!`);
      setIsNewShopModalOpen(false);
      
      // Reset form
      setNewName('');
      setNewSlug('');
      setNewAddress('');
      setNewLogoUrl('');
      setNewTheme('obsidian_noir');
      setNewPin('1234');
      setNewMonthlyFee(49);
      setNewOwnerName('');
      setNewOwnerPhone('');
      setNewOwnerEmail('');
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create shop.');
    }
  };

  const handleCopyKioskLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/?shop=${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    showToast(`Copied Kiosk Link: ${link}`);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleExecuteFactoryReset = () => {
    if (onFactoryReset) {
      onFactoryReset();
      showToast('Platform reset to default demo fleet.');
      setIsResetConfirmModalOpen(false);
    }
  };

  const handleExecuteDemoFleetReload = () => {
    if (onLoadDemoFleet) {
      onLoadDemoFleet();
      showToast('Demo fleet reloaded with test barbers & queues.');
    }
  };

  // Calculations
  const paidCount = shops.filter(s => s.subscriptionStatus === 'active' || s.subscriptionStatus === 'comped').length;
  const pastDueCount = shops.filter(s => s.subscriptionStatus === 'past_due' || s.subscriptionStatus === 'unpaid').length;
  const totalMRR = shops.reduce((acc, s) => {
    if (s.subscriptionStatus === 'active') {
      return acc + (s.subscriptionMonthlyFee || s.monthlyPlanPrice || 49);
    }
    return acc;
  }, 0);
  const totalChairs = shops.reduce((acc, s) => acc + (s.barbers?.length || 0), 0);
  const totalUnreadMessages = supportMessages.filter(m => !m.readByHq && m.sender === 'shop_owner').length;

  // Filtered Shops
  const filteredShops = shops.filter(s => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return s.subscriptionStatus === 'active' || s.subscriptionStatus === 'comped';
    if (statusFilter === 'past_due') return s.subscriptionStatus === 'past_due' || s.subscriptionStatus === 'unpaid';
    return true;
  });

  // Selected Inbox Shop
  const activeInboxShop = shops.find(s => s.slug === selectedInboxShopSlug) || shops[0];
  const activeInboxMessages = supportMessages.filter(m => m.shopSlug === activeInboxShop?.slug);

  const handleSendInboxReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxReplyText.trim() || !activeInboxShop) return;
    onSendSupportMessage(activeInboxShop.slug, inboxReplyText.trim(), 'platform_hq', 'Platform HQ');
    setInboxReplyText('');
  };

  // 1. PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        padding: 'max(56px, calc(env(safe-area-inset-top, 0px) + 24px)) 16px max(40px, env(safe-area-inset-bottom, 24px)) 16px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '28px',
          padding: '36px 24px',
          boxShadow: 'var(--shadow-bubble)',
          textAlign: 'center',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'var(--pastel-amber-bg)',
            border: '1px solid var(--pastel-amber-border)',
            color: 'var(--pastel-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Shield size={30} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            WalkinApp Platform HQ
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.4 }}>
            Enter your Master PIN to manage subscriptions, client shops, and support tickets.
          </p>

          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Master PIN (Default: 9999)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '16px',
                background: 'var(--surface-pill)',
                border: pinError ? '2px solid var(--pastel-red)' : '1px solid var(--border-subtle)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '20px',
                textAlign: 'center',
                letterSpacing: '0.3em',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {pinError && (
              <p style={{ color: 'var(--pastel-red)', fontSize: '12px', fontWeight: 700 }}>{pinError}</p>
            )}

            <button
              type="submit"
              style={{
                padding: '16px',
                background: 'var(--accent-primary)',
                color: 'var(--bg-main)',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                border: 'none'
              }}
            >
              <Lock size={16} />
              Unlock Platform Hub
            </button>
          </form>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <button
              onClick={() => onNavigateTab('kiosk')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Back to Customer Kiosk
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unlocked Platform Dashboard
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      padding: 'max(56px, calc(env(safe-area-inset-top, 0px) + 24px)) 16px max(120px, env(safe-area-inset-bottom, 32px)) 16px',
      fontFamily: 'var(--font-body)',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className="slide-down"
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-primary)',
            color: 'var(--bg-main)',
            fontWeight: 800,
            padding: '10px 22px',
            borderRadius: 9999,
            fontSize: '13px',
            zIndex: 9999,
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {toastMessage}
        </div>
      )}

      <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingBottom: '18px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'var(--surface-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Shield size={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  WalkinApp Platform HQ
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Client Subscriptions & Direct Shop Support
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onNavigateTab('kiosk')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 14px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Store size={14} />
                <span>Kiosk</span>
              </button>

              <button
                onClick={handleLock}
                title="Lock Master Hub"
                style={{
                  padding: '8px 12px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>

          {/* Top Primary Navigation Switcher: Fleet Hub vs Messages */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'var(--surface-pill)',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setHqActiveTab('fleet')}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: hqActiveTab === 'fleet' ? 'var(--surface-card)' : 'transparent',
                color: hqActiveTab === 'fleet' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: hqActiveTab === 'fleet' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Store size={16} />
              <span>Fleet & Subscriptions ({shops.length})</span>
            </button>

            <button
              onClick={() => setHqActiveTab('messages')}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: hqActiveTab === 'messages' ? 'var(--surface-card)' : 'transparent',
                color: hqActiveTab === 'messages' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: hqActiveTab === 'messages' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <MessageSquare size={16} />
              <span>Support Messages</span>
              {totalUnreadMessages > 0 && (
                <span style={{
                  background: 'var(--pastel-red)',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: 9999
                }}>
                  {totalUnreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================= TAB 1: FLEET & SUBSCRIPTION DASHBOARD ================= */}
        {hqActiveTab === 'fleet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* SaaS Metrics 4-Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Stat 1: Monthly SaaS MRR (Paying Shops) */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--pastel-green-bg)',
                  border: '1px solid var(--pastel-green-border)',
                  color: 'var(--pastel-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Software MRR
                  </p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                    ${totalMRR} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>/mo</span>
                  </p>
                </div>
              </div>

              {/* Stat 2: Active Subscriptions Status */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--pastel-blue-bg)',
                  border: '1px solid var(--pastel-blue-border)',
                  color: 'var(--pastel-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Paying Shops
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                    {paidCount} <span style={{ fontSize: '11px', color: pastDueCount > 0 ? 'var(--pastel-red)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {pastDueCount > 0 ? `(${pastDueCount} Past Due)` : 'All Current'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Stat 3: Total Fleet Barbers */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--pastel-amber-bg)',
                  border: '1px solid var(--pastel-amber-border)',
                  color: 'var(--pastel-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Fleet Chairs
                  </p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                    {totalChairs} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Active</span>
                  </p>
                </div>
              </div>

              {/* Stat 4: Support Tickets / Unread */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: totalUnreadMessages > 0 ? 'var(--pastel-red-bg)' : 'var(--surface-pill)',
                  border: `1px solid ${totalUnreadMessages > 0 ? 'var(--pastel-red-border)' : 'var(--border-subtle)'}`,
                  color: totalUnreadMessages > 0 ? 'var(--pastel-red)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    Support Inbox
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 900, color: totalUnreadMessages > 0 ? 'var(--pastel-red)' : 'var(--text-primary)', margin: '1px 0 0' }}>
                    {totalUnreadMessages} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Unread</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Fleet Action Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsNewShopModalOpen(true)}
                style={{
                  flex: '1 1 auto',
                  minWidth: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '11px 18px',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 850,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  border: 'none'
                }}
              >
                <Plus size={16} />
                <span>Add Barbershop</span>
              </button>

              <button
                onClick={handleExecuteDemoFleetReload}
                title="Reload demo test shops"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '11px 14px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} />
                <span>Reload Demo Fleet</span>
              </button>

              <button
                onClick={() => setIsResetConfirmModalOpen(true)}
                title="Reset platform data"
                style={{
                  padding: '11px 14px',
                  background: 'var(--pastel-red-bg)',
                  border: '1px solid var(--pastel-red-border)',
                  color: 'var(--pastel-red)',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Trash2 size={14} />
                <span>Factory Reset</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 750,
                    background: statusFilter === 'all' ? 'var(--text-primary)' : 'var(--surface-pill)',
                    color: statusFilter === 'all' ? 'var(--bg-main)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  All Shops ({shops.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 750,
                    background: statusFilter === 'active' ? 'var(--pastel-green)' : 'rgba(16, 185, 129, 0.12)',
                    color: statusFilter === 'active' ? '#000000' : 'var(--pastel-green)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    cursor: 'pointer'
                  }}
                >
                  Paid & Active ({paidCount})
                </button>
                <button
                  onClick={() => setStatusFilter('past_due')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 750,
                    background: statusFilter === 'past_due' ? 'var(--pastel-red)' : 'rgba(239, 68, 68, 0.12)',
                    color: statusFilter === 'past_due' ? '#FFFFFF' : 'var(--pastel-red)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    cursor: 'pointer'
                  }}
                >
                  Past Due ({pastDueCount})
                </button>
              </div>
            </div>

            {/* Shop Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '14px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {filteredShops.map((shop) => {
                const isCurrentlyActive = shop.slug === activeShopSlug;
                const barbersCount = shop.barbers?.length || 0;
                const walkInsCount = shop.checkIns?.length || 0;
                const shopUnreadCount = supportMessages.filter(m => m.shopSlug === shop.slug && !m.readByHq && m.sender === 'shop_owner').length;
                
                const isComped = shop.subscriptionStatus === 'comped' || (shop.subscriptionMonthlyFee === 0 && shop.slug === 'of');
                const isPaid = shop.subscriptionStatus === 'active';
                const isPastDue = shop.subscriptionStatus === 'past_due' || shop.subscriptionStatus === 'unpaid';

                return (
                  <div
                    key={shop.id}
                    style={{
                      background: 'var(--surface-card)',
                      border: isCurrentlyActive 
                        ? '2px solid var(--text-primary)' 
                        : isPastDue 
                          ? '1px solid var(--pastel-red-border)' 
                          : '1px solid var(--border-subtle)',
                      borderRadius: '22px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Header Row: Logo, Name, Address, Theme */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        {shop.logoUrl ? (
                          <img 
                            src={shop.logoUrl} 
                            alt={shop.name}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              objectFit: 'contain',
                              background: '#FFFFFF',
                              padding: '2px',
                              border: '1px solid var(--border-subtle)',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--surface-pill)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-primary)',
                              fontWeight: 900,
                              fontSize: '14px',
                              flexShrink: 0
                            }}
                          >
                            {shop.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {shop.name}
                          </h3>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {shop.address || 'Address Pending'}
                          </p>
                        </div>
                      </div>

                      {/* Theme Toggle Pill */}
                      <button
                        onClick={() => setThemeModalShop(shop)}
                        title="Change Colorway"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 9px',
                          borderRadius: '9999px',
                          background: 'var(--surface-pill)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {shop.themeId === 'clean_studio' ? (
                          <Sun size={12} style={{ color: '#F59E0B' }} />
                        ) : (
                          <Moon size={12} style={{ color: 'var(--text-primary)' }} />
                        )}
                        <span>{shop.themeId === 'clean_studio' ? 'Light' : 'Dark'}</span>
                      </button>
                    </div>

                    {/* ================= SUBSCRIPTION BILLING BOX ================= */}
                    <div style={{
                      background: isComped 
                        ? 'rgba(59, 130, 246, 0.08)' 
                        : isPaid 
                          ? 'rgba(16, 185, 129, 0.08)' 
                          : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${isComped ? 'rgba(59, 130, 246, 0.25)' : isPaid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      borderRadius: '14px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Subscription Status Tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            letterSpacing: '0.02em',
                            background: isComped 
                              ? 'rgba(59, 130, 246, 0.15)' 
                              : isPaid 
                                ? 'rgba(16, 185, 129, 0.15)' 
                                : 'rgba(239, 68, 68, 0.15)',
                            color: isComped 
                              ? 'var(--pastel-blue, #60A5FA)' 
                              : isPaid 
                                ? 'var(--pastel-green, #10B981)' 
                                : 'var(--pastel-red, #EF4444)',
                            border: `1px solid ${isComped ? 'rgba(59, 130, 246, 0.35)' : isPaid ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                          }}>
                            {isComped 
                              ? 'COMPED / FLAGSHIP' 
                              : isPaid 
                                ? `ACTIVE & PAID ($${shop.subscriptionMonthlyFee || 49}/mo)` 
                                : `PAST DUE ($${shop.subscriptionMonthlyFee || 49} OVERDUE)`}
                          </span>

                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {isComped 
                              ? 'No billing' 
                              : `Next: ${shop.subscriptionNextBillingDate || 'Pending'}${shop.subscriptionStartDate ? ` • Billed monthly (Day ${parseInt(shop.subscriptionStartDate.split('-')[2] || '1', 10)})` : ''}`}
                          </span>
                        </div>

                        {/* Quick Mark Paid / Manage Sub Action */}
                        {!isComped && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isPastDue && (
                              <button
                                onClick={() => handleQuickMarkPaid(shop)}
                                style={{
                                  padding: '4px 9px',
                                  background: 'var(--pastel-green)',
                                  color: '#FFFFFF',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Check size={12} />
                                <span>Mark Paid</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenSubModal(shop)}
                              style={{
                                padding: '4px 8px',
                                background: 'var(--surface-card)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Billing Settings
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Owner Contact info */}
                      {(shop.ownerContactName || shop.ownerPhone) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', flexWrap: 'wrap' }}>
                          {shop.ownerContactName && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 650 }}>
                              <User size={12} style={{ color: 'var(--text-muted)' }} />
                              {shop.ownerContactName}
                            </span>
                          )}
                          {shop.ownerPhone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                              {shop.ownerPhone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info Pills: Chairs & Queue */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '6px',
                      background: 'var(--surface-pill)',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>
                          Code
                        </p>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          ?shop={shop.slug}
                        </p>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>
                          Chairs
                        </p>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {barbersCount} Chairs
                        </p>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>
                          Live Queue
                        </p>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--pastel-green)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {walkInsCount} Waiting
                        </p>
                      </div>
                    </div>

                    {/* Master Action Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                      {/* Row 1: Primary Portals Jump */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', width: '100%' }}>
                        {/* Master 1-Tap Jump to Owner Admin */}
                        <button
                          onClick={() => handleMasterJumpToAdmin(shop.slug)}
                          style={{
                            padding: '10px 8px',
                            background: 'var(--accent-primary)',
                            color: 'var(--bg-main)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 850,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            border: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          <Lock size={13} />
                          <span>Owner Admin</span>
                        </button>

                        {/* Kiosk Button */}
                        <button
                          onClick={() => {
                            onSwitchShop(shop.slug);
                            onNavigateTab('kiosk');
                          }}
                          style={{
                            padding: '10px 8px',
                            background: 'var(--surface-pill)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <Store size={13} />
                          <span>Kiosk</span>
                        </button>

                        {/* Barber Portal Button */}
                        <button
                          onClick={() => {
                            onSwitchShop(shop.slug);
                            onNavigateTab('barber_portal');
                          }}
                          style={{
                            padding: '10px 8px',
                            background: 'var(--surface-pill)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <Scissors size={13} />
                          <span>Barbers</span>
                        </button>
                      </div>

                      {/* Row 2: Chat, Edit, Copy Link, Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                        {/* In-App Direct Chat Button */}
                        <button
                          onClick={() => setChatDrawerShop(shop)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            background: shopUnreadCount > 0 ? 'var(--pastel-red-bg)' : 'var(--surface-pill)',
                            border: `1px solid ${shopUnreadCount > 0 ? 'var(--pastel-red-border)' : 'var(--border-subtle)'}`,
                            color: shopUnreadCount > 0 ? 'var(--pastel-red)' : 'var(--text-primary)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <MessageSquare size={13} />
                          <span>Chat</span>
                          {shopUnreadCount > 0 && (
                            <span style={{
                              background: 'var(--pastel-red)',
                              color: '#FFFFFF',
                              fontSize: '9px',
                              fontWeight: 900,
                              padding: '1px 5px',
                              borderRadius: 9999
                            }}>
                              {shopUnreadCount}
                            </span>
                          )}
                        </button>

                        {/* Edit Shop Details */}
                        <button
                          onClick={() => handleOpenEditModal(shop)}
                          style={{
                            padding: '8px 10px',
                            background: 'var(--surface-pill)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyKioskLink(shop.slug)}
                          title="Copy direct link"
                          style={{
                            padding: '8px 10px',
                            background: 'var(--surface-pill)',
                            border: '1px solid var(--border-subtle)',
                            color: copiedSlug === shop.slug ? 'var(--pastel-green)' : 'var(--text-secondary)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {copiedSlug === shop.slug ? <Check size={13} /> : <Copy size={13} />}
                          <span>Link</span>
                        </button>

                        {/* Delete Shop */}
                        <button
                          onClick={() => setDeleteConfirmShop(shop)}
                          title="Delete Barbershop"
                          style={{
                            padding: '8px 10px',
                            background: 'var(--pastel-red-bg)',
                            border: '1px solid var(--pastel-red-border)',
                            color: 'var(--pastel-red)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: UNIFIED SUPPORT MESSAGES INBOX ================= */}
        {hqActiveTab === 'messages' && (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-bubble)'
          }}>
            {/* Inbox Header & Shop Selector */}
            <div style={{
              padding: '16px',
              background: 'var(--surface-pill)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                  Support Conversations
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                  Live in-app messaging with barbershop owners
                </p>
              </div>

              {/* Shop Picker Tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {shops.map((s) => {
                  const unread = supportMessages.filter(m => m.shopSlug === s.slug && !m.readByHq && m.sender === 'shop_owner').length;
                  const isSelected = s.slug === activeInboxShop?.slug;

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedInboxShopSlug(s.slug);
                        onMarkSupportRead(s.slug, 'hq');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 750,
                        background: isSelected ? 'var(--accent-primary)' : 'var(--surface-card)',
                        color: isSelected ? 'var(--bg-main)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>{s.name}</span>
                      {unread > 0 && (
                        <span style={{
                          background: 'var(--pastel-red)',
                          color: '#FFFFFF',
                          fontSize: '9px',
                          fontWeight: 900,
                          padding: '1px 5px',
                          borderRadius: 9999
                        }}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Messages View */}
            <div style={{
              height: '380px',
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {activeInboxMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>No messages yet with {activeInboxShop?.name}</p>
                </div>
              ) : (
                activeInboxMessages.map((msg) => {
                  const isMine = msg.sender === 'platform_hq';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        alignSelf: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 750, color: 'var(--text-muted)', marginBottom: '3px' }}>
                        {isMine ? 'You (Platform HQ)' : msg.senderName || `${activeInboxShop?.name} Owner`}
                      </div>

                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMine ? 'var(--accent-primary)' : 'var(--surface-pill)',
                        color: isMine ? 'var(--bg-main)' : 'var(--text-primary)',
                        border: isMine ? 'none' : '1px solid var(--border-subtle)',
                        fontSize: '13px',
                        lineHeight: 1.4
                      }}>
                        {msg.text}
                      </div>

                      <span style={{ fontSize: '9px', color: 'var(--text-light)', marginTop: '2px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Bar */}
            <form
              onSubmit={handleSendInboxReply}
              style={{
                padding: '12px 16px',
                background: 'var(--surface-pill)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <input
                type="text"
                placeholder={`Reply to ${activeInboxShop?.name}...`}
                value={inboxReplyText}
                onChange={(e) => setInboxReplyText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!inboxReplyText.trim()}
                style={{
                  padding: '12px 16px',
                  background: inboxReplyText.trim() ? 'var(--accent-primary)' : 'var(--surface-card)',
                  color: inboxReplyText.trim() ? 'var(--bg-main)' : 'var(--text-muted)',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: '1px solid var(--border-subtle)',
                  cursor: inboxReplyText.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD NEW BARBERSHOP ================= */}
      {isNewShopModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '26px',
            padding: '24px 20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-bubble)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '7px', background: 'var(--surface-pill)', color: 'var(--text-primary)', borderRadius: '10px' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                    Add Barbershop
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                    Create a new shop tenant with subscription details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewShopModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px', background: 'var(--pastel-red-bg)', border: '1px solid var(--pastel-red-border)', borderRadius: '12px', color: 'var(--pastel-red)', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateShopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crown Barbershop"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>URL Link Code *</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0 12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>?shop=</span>
                  <input
                    type="text"
                    required
                    placeholder="crown"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    style={{ flex: 1, padding: '12px 6px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Rivera"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Owner Phone</label>
                  <input
                    type="text"
                    placeholder="(555) 000-0000"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly Fee ($/mo)</label>
                  <input
                    type="number"
                    value={newMonthlyFee}
                    onChange={(e) => setNewMonthlyFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Owner PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', textAlign: 'center', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. 1204 Main St, Suite B"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewShopModalOpen(false)}
                  style={{ padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px', background: 'var(--accent-primary)', color: 'var(--bg-main)', borderRadius: '14px', fontSize: '13px', fontWeight: 850, border: 'none', cursor: 'pointer' }}
                >
                  Create Barbershop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SHOP DETAILS ================= */}
      {editModalShop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '26px',
            padding: '24px 20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-bubble)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'var(--text-primary)' }} />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                    Edit {editModalShop.name}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                    Update contact, PIN & default rent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalShop(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditShop} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Shop Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Owner Name</label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Owner Phone</label>
                  <input
                    type="text"
                    value={editOwnerPhone}
                    onChange={(e) => setEditOwnerPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Manager PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', textAlign: 'center', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Default Rent ($/wk)</label>
                  <input
                    type="number"
                    value={editWeeklyRent}
                    onChange={(e) => setEditWeeklyRent(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalShop(null)}
                  style={{ padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px', background: 'var(--accent-primary)', color: 'var(--bg-main)', borderRadius: '14px', fontSize: '13px', fontWeight: 850, border: 'none', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANAGE SUBSCRIPTION BILLING ================= */}
      {subscriptionModalShop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '26px',
            padding: '24px 20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-bubble)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: 'var(--pastel-green)' }} />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                    Subscription: {subscriptionModalShop.name}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                    Track and manage monthly payments to you
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubscriptionModalShop(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Subscription Status</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value as SubscriptionStatus)}
                  style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                >
                  <option value="active">Active (Paid)</option>
                  <option value="past_due">Past Due / Overdue</option>
                  <option value="comped">Comped / Flagship ($0)</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly Rate ($/mo)</label>
                  <input
                    type="number"
                    value={subFee}
                    onChange={(e) => setSubFee(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cycle Start Date (Anchor)</label>
                  <input
                    type="date"
                    value={subStartDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSubStartDate(newDate);
                      if (newDate) {
                        const d = new Date(newDate + 'T00:00:00');
                        d.setMonth(d.getMonth() + 1);
                        setSubNextBilling(d.toISOString().split('T')[0]);
                      }
                    }}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Next Renewal Date</label>
                  <input
                    type="date"
                    value={subNextBilling}
                    onChange={(e) => setSubNextBilling(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payment Method</label>
                  <select
                    value={subPaymentMethod}
                    onChange={(e) => setSubPaymentMethod(e.target.value as SubscriptionPaymentMethod)}
                    style={{ width: '100%', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                  >
                    <option value="zelle">Zelle Transfer</option>
                    <option value="cash">Cash In-Person</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="stripe">Stripe Subscription</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="manual">Manual / Comped</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSubscriptionModalShop(null)}
                  style={{ padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px', background: 'var(--accent-primary)', color: 'var(--bg-main)', borderRadius: '14px', fontSize: '13px', fontWeight: 850, border: 'none', cursor: 'pointer' }}
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: 2-COLORWAY THEME PICKER ================= */}
      {themeModalShop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '26px',
            padding: '24px 20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-bubble)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={18} style={{ color: 'var(--text-primary)' }} />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Colorway: {themeModalShop.name}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                    Select Light or Dark theme
                  </p>
                </div>
              </div>
              <button
                onClick={() => setThemeModalShop(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '18px' }}>
              {/* Option 1: Studio Light */}
              <button
                onClick={() => {
                  onUpdateShop(themeModalShop.slug, { themeId: 'clean_studio' });
                  applyTheme('clean_studio');
                  setThemeModalShop({ ...themeModalShop, themeId: 'clean_studio' });
                  showToast(`Applied Studio Light to ${themeModalShop.name}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  color: '#09090B',
                  border: themeModalShop.themeId === 'clean_studio' ? '2px solid #09090B' : '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F4F4F5', border: '1px solid #E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sun size={18} style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#09090B' }}>
                    Studio Light
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#71717A' }}>
                    Crisp white, frosted glass & pastel accents
                  </p>
                </div>
                {themeModalShop.themeId === 'clean_studio' && (
                  <Check size={18} style={{ marginLeft: 'auto', color: '#09090B' }} />
                )}
              </button>

              {/* Option 2: Obsidian Dark */}
              <button
                onClick={() => {
                  onUpdateShop(themeModalShop.slug, { themeId: 'obsidian_noir' });
                  applyTheme('obsidian_noir');
                  setThemeModalShop({ ...themeModalShop, themeId: 'obsidian_noir' });
                  showToast(`Applied Obsidian Dark to ${themeModalShop.name}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#09090B',
                  color: '#FAFAFA',
                  border: (themeModalShop.themeId === 'obsidian_noir' || themeModalShop.themeId === 'obsidian_emerald') ? '2px solid #FAFAFA' : '1px solid #27272A',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#18181B', border: '1px solid #27272A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon size={18} style={{ color: '#FAFAFA' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#FAFAFA' }}>
                    Obsidian Dark
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#A1A1AA' }}>
                    Sleek dark mode with glassmorphism & pastel glow
                  </p>
                </div>
                {(themeModalShop.themeId === 'obsidian_noir' || themeModalShop.themeId === 'obsidian_emerald') && (
                  <Check size={18} style={{ marginLeft: 'auto', color: '#FAFAFA' }} />
                )}
              </button>
            </div>

            <button
              onClick={() => setThemeModalShop(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--surface-pill)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteConfirmShop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: 'var(--surface-card)',
            border: '1px solid var(--pastel-red-border)',
            borderRadius: '24px',
            padding: '24px 20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-bubble)',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'var(--pastel-red-bg)',
              color: 'var(--pastel-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 850, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Delete "{deleteConfirmShop.name}"?
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 18px' }}>
              This will remove the shop and its kiosk URL. This action cannot be undone.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirmShop(null)}
                style={{
                  padding: '11px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (shops.length <= 1) {
                    alert('Cannot delete the only shop. Create another first.');
                    setDeleteConfirmShop(null);
                    return;
                  }
                  onDeleteShop(deleteConfirmShop.slug);
                  showToast(`Deleted ${deleteConfirmShop.name}`);
                  setDeleteConfirmShop(null);
                }}
                style={{
                  padding: '11px',
                  background: 'var(--pastel-red)',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 850,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Delete Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: FACTORY RESET CONFIRMATION ================= */}
      {isResetConfirmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--surface-card)',
            border: '1px solid var(--pastel-red-border)',
            borderRadius: '26px',
            padding: '26px 20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-bubble)',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: 'var(--pastel-red-bg)',
              color: 'var(--pastel-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 850, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Factory Reset Platform?
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 18px' }}>
              This will wipe test check-in records and restore your default fleet configurations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setIsResetConfirmModalOpen(false)}
                style={{
                  padding: '11px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteFactoryReset}
                style={{
                  padding: '11px',
                  background: 'var(--pastel-red)',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 850,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reset Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IN-APP SUPPORT CHAT DRAWER ================= */}
      {chatDrawerShop && (
        <SupportChatDrawer
          isOpen={!!chatDrawerShop}
          onClose={() => setChatDrawerShop(null)}
          currentShop={chatDrawerShop}
          messages={supportMessages}
          userRole="platform_hq"
          onSendMessage={(text) => {
            onSendSupportMessage(chatDrawerShop.slug, text, 'platform_hq', 'Platform HQ');
          }}
          onMarkRead={() => {
            onMarkSupportRead(chatDrawerShop.slug, 'hq');
          }}
        />
      )}
    </div>
  );
}
