import { useState } from 'react';
import { 
  Shield, 
  Store, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Palette, 
  Copy, 
  Check, 
  Settings, 
  Scissors, 
  Lock, 
  Sparkles, 
  Trash2, 
  LogOut,
  RotateCcw,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import type { Shop, MainNavTab } from '../../types';
import { THEME_PRESETS, applyTheme, type ThemeId } from '../../utils/themes';
import { storage } from '../../utils/storage';

interface SuperAdminDashboardProps {
  shops: Shop[];
  activeShopSlug: string;
  onSwitchShop: (slug: string) => void;
  onCreateShop: (shopData: Partial<Shop> & { name: string; slug: string; themeId: ThemeId }) => Shop;
  onUpdateShop: (slug: string, updates: Partial<Shop>) => Shop;
  onDeleteShop: (slug: string) => void;
  onFactoryReset?: () => void;
  onLoadDemoFleet?: () => void;
  onNavigateTab: (tab: MainNavTab) => void;
}

export function SuperAdminDashboard({
  shops,
  activeShopSlug,
  onSwitchShop,
  onCreateShop,
  onUpdateShop,
  onDeleteShop,
  onFactoryReset,
  onLoadDemoFleet,
  onNavigateTab
}: SuperAdminDashboardProps) {
  // Master Super Admin Authentication State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('walkin_super_admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Modals
  const [isNewShopModalOpen, setIsNewShopModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [themeModalShop, setThemeModalShop] = useState<Shop | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Shop Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newTheme, setNewTheme] = useState<ThemeId>('obsidian_emerald');
  const [newPin, setNewPin] = useState('1234');
  const [newMonthlyPrice, setNewMonthlyPrice] = useState(49);
  const [formError, setFormError] = useState('');

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

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!newSlug || newSlug === newName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setNewSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  // Submit New Shop
  const handleCreateShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      setFormError('Shop Name and URL Link Code are required.');
      return;
    }

    try {
      const created = onCreateShop({
        name: newName.trim(),
        slug: newSlug.trim(),
        address: newAddress.trim(),
        logoUrl: newLogoUrl.trim(),
        themeId: newTheme,
        pinCode: newPin.trim() || '1234',
        monthlyPlanPrice: newMonthlyPrice
      });

      // Switch to new shop
      onSwitchShop(created.slug);
      setIsNewShopModalOpen(false);
      setNewName('');
      setNewSlug('');
      setNewAddress('');
      setNewLogoUrl('');
      setFormError('');
      showToast(`Created & launched ${created.name}!`);
    } catch (err: any) {
      setFormError(err?.message || 'Could not create shop.');
    }
  };

  // Copy Kiosk Link
  const handleCopyKioskLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://walkinapp.io';
    const link = `${origin}/?shop=${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Execute Factory Reset
  const handleExecuteFactoryReset = () => {
    if (onFactoryReset) {
      onFactoryReset();
    } else {
      storage.factoryResetPlatform();
    }
    setIsResetConfirmModalOpen(false);
    showToast('Platform reset to clean launch state (OF Supply only, 0 queue records).');
  };

  // Execute Demo Fleet Reload
  const handleExecuteDemoFleetReload = () => {
    if (onLoadDemoFleet) {
      onLoadDemoFleet();
    } else {
      storage.loadDemoFleet();
    }
    showToast('Loaded 3 demo test shops (OF Supply, Fade Masters, Royal Cuts).');
  };

  // Calculate Platform Aggregate Metrics
  const totalShops = shops.length;
  const totalBarbers = shops.reduce((acc, s) => acc + (s.barbers?.length || 0), 0);
  const totalWalkInsToday = shops.reduce((acc, s) => acc + (s.checkIns?.length || 0), 0);
  const totalEstimatedMRR = shops.reduce((acc, s) => acc + (s.monthlyPlanPrice || 49), 0);

  // 1. PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #18181B 0%, #09090B 80%, #000000 100%)',
        padding: '16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: '#18181B',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '28px',
          padding: '36px 24px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(234, 179, 8, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#F59E0B'
          }}>
            <Shield size={32} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FAFAFA', marginBottom: '8px' }}>
            WalkinApp Platform Hub
          </h2>
          <p style={{ fontSize: '13px', color: '#A1A1AA', marginBottom: '28px' }}>
            Enter your Master Platform PIN to access and manage your barbershop fleet.
          </p>

          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                background: '#09090B',
                border: pinError ? '2px solid #EF4444' : '1px solid #3F3F46',
                borderRadius: '16px',
                color: '#FAFAFA',
                fontSize: '20px',
                textAlign: 'center',
                letterSpacing: '0.3em',
                outline: 'none'
              }}
            />

            {pinError && (
              <p style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>{pinError}</p>
            )}

            <button
              type="submit"
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#000000',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Lock size={18} />
              Unlock Platform Hub
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid #27272A', paddingTop: '16px' }}>
            <button
              onClick={() => onNavigateTab('kiosk')}
              style={{
                background: 'none',
                border: 'none',
                color: '#71717A',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ← Back to Kiosk
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unlocked Platform Dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #18181B 0%, #09090B 75%, #050507 100%)',
      color: '#FAFAFA',
      padding: '24px 16px',
      fontFamily: 'var(--font-body)',
      width: '100%',
      boxSizing: 'border-box'
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
            background: '#F59E0B',
            color: '#000000',
            fontWeight: 800,
            padding: '10px 20px',
            borderRadius: 9999,
            fontSize: '13px',
            zIndex: 9999,
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)'
          }}
        >
          {toastMessage}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#F59E0B',
                display: 'flex'
              }}>
                <Shield size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                  WalkinApp Platform Hub
                </h1>
                <p style={{ fontSize: '13px', color: '#A1A1AA', margin: 0 }}>
                  Master command center for all barbershop accounts, live test fleet & kiosk setups
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Add Shop, Load Demo Fleet, Factory Reset, Exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsNewShopModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#000',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 850,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)'
              }}
            >
              <Plus size={15} />
              + Add Shop
            </button>

            {/* Test Fleet Button */}
            <button
              onClick={handleExecuteDemoFleetReload}
              title="Load 3 demo test shops (OF Supply, Fade Masters, Royal Cuts)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} style={{ color: '#F59E0B' }} />
              <span>Reload Demo Fleet</span>
            </button>

            {/* Factory Reset for Sales Button */}
            <button
              onClick={() => setIsResetConfirmModalOpen(true)}
              title="Reset platform to clean initial launch state before selling"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#EF4444',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
              <span>Clean Slate Reset</span>
            </button>

            <button
              onClick={() => onNavigateTab('kiosk')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 600,
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
                padding: '10px',
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#A1A1AA',
                borderRadius: '14px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '28px'
        }}>
          {/* Metric 1 */}
          <div style={{
            background: '#18181B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Active Shops
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#FAFAFA', margin: 0 }}>
                {totalShops}
              </p>
            </div>
          </div>

          {/* Metric 2 */}
          <div style={{
            background: '#18181B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Total Barbers
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#FAFAFA', margin: 0 }}>
                {totalBarbers}
              </p>
            </div>
          </div>

          {/* Metric 3 */}
          <div style={{
            background: '#18181B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                SaaS Revenue (MRR)
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#FAFAFA', margin: 0 }}>
                ${totalEstimatedMRR} <span style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>/ mo</span>
              </p>
            </div>
          </div>

          {/* Metric 4 */}
          <div style={{
            background: '#18181B',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#EC4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Walk-ins / Queue Today
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#FAFAFA', margin: 0 }}>
                {totalWalkInsToday}
              </p>
            </div>
          </div>
        </div>

        {/* Barbershop Fleet List Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 850, margin: 0 }}>
              Barbershop Fleet Accounts ({shops.length})
            </h2>
            <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '3px 0 0' }}>
              Select any shop to launch its kiosk, change colorways, or test deleting shops live
            </p>
          </div>
        </div>

        {/* Shop Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {shops.map((shop) => {
            const isCurrentlyActive = shop.slug === activeShopSlug;
            const theme = THEME_PRESETS[shop.themeId] || THEME_PRESETS.midnight_gold;
            const barbersCount = shop.barbers?.length || 0;
            const walkInsCount = shop.checkIns?.length || 0;

            return (
              <div
                key={shop.id}
                style={{
                  background: '#18181B',
                  border: isCurrentlyActive 
                    ? `2px solid ${theme.previewColor}` 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '22px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isCurrentlyActive 
                    ? `0 12px 32px -4px ${theme.previewColor}33` 
                    : '0 8px 24px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                {/* Top Banner with Theme Pill */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: theme.bgMain,
                          border: `2px solid ${theme.previewColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.previewColor,
                          fontWeight: 900,
                          fontSize: '16px',
                          flexShrink: 0
                        }}
                      >
                        <Scissors size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FAFAFA', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {shop.name}
                          </h3>
                          {shop.slug === 'of' && (
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(234, 179, 8, 0.2)',
                              color: '#F59E0B',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              ORIGINAL
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shop.address || 'Location Address Pending'}
                        </p>
                      </div>
                    </div>

                    {/* Theme Badge */}
                    <button
                      onClick={() => setThemeModalShop(shop)}
                      title="Change Theme Colorway"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: theme.accentLight,
                        border: `1px solid ${theme.accentColor}40`,
                        color: theme.accentColor,
                        fontSize: '10px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <Palette size={11} />
                      <span>{theme.name}</span>
                    </button>
                  </div>

                  {/* Info stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    background: '#09090B',
                    borderRadius: '12px',
                    padding: '10px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <p style={{ fontSize: '9px', color: '#71717A', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                        Link Code
                      </p>
                      <p style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', margin: '2px 0 0' }}>
                        ?shop={shop.slug}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '9px', color: '#71717A', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                        Barbers
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#FAFAFA', margin: '2px 0 0' }}>
                        {barbersCount} Chairs
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '9px', color: '#71717A', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                        In Queue
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', margin: '2px 0 0' }}>
                        {walkInsCount} Waiting
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => {
                        onSwitchShop(shop.slug);
                        onNavigateTab('kiosk');
                      }}
                      style={{
                        padding: '9px',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#000',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Store size={13} />
                      <span>Launch Kiosk</span>
                    </button>

                    <button
                      onClick={() => {
                        onSwitchShop(shop.slug);
                        onNavigateTab('barber_portal');
                      }}
                      style={{
                        padding: '9px',
                        background: '#27272A',
                        border: '1px solid #3F3F46',
                        color: '#FAFAFA',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Scissors size={13} />
                      <span>Barber Hub</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        onSwitchShop(shop.slug);
                        onNavigateTab('admin');
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#D4D4D8',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Settings size={12} />
                      <span>Admin (PIN: {shop.pinCode})</span>
                    </button>

                    <button
                      onClick={() => handleCopyKioskLink(shop.slug)}
                      title="Copy Kiosk URL"
                      style={{
                        padding: '7px 10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: copiedSlug === shop.slug ? '#10B981' : '#A1A1AA',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 650,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedSlug === shop.slug ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedSlug === shop.slug ? 'Copied!' : 'Link'}</span>
                    </button>

                    {/* Delete Shop Button (Allows deleting test shops live!) */}
                    <button
                      onClick={() => {
                        if (shops.length <= 1) {
                          alert('Cannot delete the only remaining shop. Create another shop first or use Reset.');
                          return;
                        }
                        if (confirm(`Delete "${shop.name}" from platform?`)) {
                          onDeleteShop(shop.slug);
                          showToast(`Deleted ${shop.name}`);
                        }
                      }}
                      title="Delete Barbershop"
                      style={{
                        padding: '7px 9px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Modal: Add New Barbershop in 30 seconds */}
      {isNewShopModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            background: '#18181B',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '26px',
            padding: '28px 24px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#F59E0B', borderRadius: '10px' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, color: '#FAFAFA' }}>
                    Onboard New Barbershop
                  </h3>
                  <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0' }}>
                    Set up a new client shop with custom branding in 30 seconds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewShopModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '12px', color: '#EF4444', fontSize: '12px', marginBottom: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateShopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Field 1: Shop Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '5px' }}>
                  Barbershop Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crown & Blade Barber Lounge"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#09090B',
                    border: '1px solid #3F3F46',
                    borderRadius: '12px',
                    color: '#FAFAFA',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Field 2: Custom URL Link Code */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '5px' }}>
                  Unique URL Link Code (Slug) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#09090B', border: '1px solid #3F3F46', borderRadius: '12px', overflow: 'hidden' }}>
                  <span style={{ padding: '0 10px', color: '#71717A', fontSize: '12px' }}>
                    /?shop=
                  </span>
                  <input
                    type="text"
                    placeholder="crownblade"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    required
                    style={{
                      flex: 1,
                      padding: '12px 14px 12px 0',
                      background: 'transparent',
                      border: 'none',
                      color: '#F59E0B',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Field 3: Address */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '5px' }}>
                  Physical Location Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 520 Main Street, Suite 4B"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: '#09090B',
                    border: '1px solid #3F3F46',
                    borderRadius: '12px',
                    color: '#FAFAFA',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Field 3B: Custom Logo Image (Home Screen Icon & Kiosk Logo) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '5px' }}>
                  Custom Shop Logo (Home Screen Icon & Kiosk)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Paste logo URL or upload image below"
                    value={newLogoUrl}
                    onChange={(e) => setNewLogoUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      background: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: '12px',
                      color: '#FAFAFA',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <label
                    style={{
                      padding: '12px 14px',
                      background: '#27272A',
                      border: '1px solid #3F3F46',
                      borderRadius: '12px',
                      color: '#FAFAFA',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewLogoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: '#71717A', margin: '4px 0 0' }}>
                  If left blank, an icon with the shop's initials and theme colors is auto-generated!
                </p>
              </div>

              {/* Field 4: Curated Colorways Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '6px' }}>
                  Select Shop Theme / Colorway *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {(Object.keys(THEME_PRESETS) as ThemeId[]).map((themeKey) => {
                    const preset = THEME_PRESETS[themeKey];
                    const isSelected = newTheme === themeKey;

                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setNewTheme(themeKey)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: preset.bgMain,
                          border: isSelected ? `2px solid ${preset.previewColor}` : '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: preset.previewColor,
                            boxShadow: `0 0 8px ${preset.previewColor}`,
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 750, color: '#FAFAFA', margin: 0 }}>
                            {preset.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 5: Shop Owner PIN & Subscription */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '5px' }}>
                    Shop Owner PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="1234"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: '12px',
                      color: '#FAFAFA',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D4D4D8', marginBottom: '5px' }}>
                    Plan Fee ($/mo)
                  </label>
                  <input
                    type="number"
                    value={newMonthlyPrice}
                    onChange={(e) => setNewMonthlyPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: '12px',
                      color: '#FAFAFA',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '6px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#000',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Sparkles size={16} />
                Create & Launch Barbershop
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Live Theme & Branding Customizer */}
      {themeModalShop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: '#18181B',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '26px',
            padding: '28px 22px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={20} style={{ color: '#F59E0B' }} />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FAFAFA' }}>
                    Branding: {themeModalShop.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0' }}>
                    Switch theme colorway instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setThemeModalShop(null)}
                style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '20px' }}>
              {(Object.keys(THEME_PRESETS) as ThemeId[]).map((themeKey) => {
                const preset = THEME_PRESETS[themeKey];
                const isCurrent = themeModalShop.themeId === themeKey;

                return (
                  <button
                    key={themeKey}
                    onClick={() => {
                      onUpdateShop(themeModalShop.slug, { themeId: themeKey });
                      applyTheme(themeKey);
                      setThemeModalShop({ ...themeModalShop, themeId: themeKey });
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '14px',
                      background: preset.bgMain,
                      border: isCurrent ? `2px solid ${preset.previewColor}` : '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: preset.previewColor,
                          boxShadow: `0 0 10px ${preset.previewColor}`
                        }}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#FAFAFA', margin: 0 }}>
                          {preset.name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0 }}>
                          {preset.tagline}
                        </p>
                      </div>
                    </div>
                    {isCurrent && <Check size={16} style={{ color: preset.previewColor }} />}
                  </button>
                );
              })}
            </div>

            {/* Custom Logo Upload for this Barbershop */}
            <div style={{ marginBottom: '20px', padding: '14px', background: '#09090B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#D4D4D8', marginBottom: '6px' }}>
                Custom Shop Logo (Home Screen App Icon & Kiosk)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Paste image URL"
                  value={themeModalShop.logoUrl || ''}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    onUpdateShop(themeModalShop.slug, { logoUrl: newUrl });
                    setThemeModalShop({ ...themeModalShop, logoUrl: newUrl });
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#18181B',
                    border: '1px solid #3F3F46',
                    borderRadius: '10px',
                    color: '#FAFAFA',
                    fontSize: '12px'
                  }}
                />
                <label
                  style={{
                    padding: '10px 14px',
                    background: '#27272A',
                    border: '1px solid #3F3F46',
                    borderRadius: '10px',
                    color: '#FAFAFA',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64 = reader.result as string;
                          onUpdateShop(themeModalShop.slug, { logoUrl: base64 });
                          setThemeModalShop({ ...themeModalShop, logoUrl: base64 });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              {themeModalShop.logoUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <img
                    src={themeModalShop.logoUrl}
                    alt="Logo preview"
                    style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', background: '#FFFFFF', padding: '2px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>Custom Home Screen Icon Active</span>
                  <button
                    onClick={() => {
                      onUpdateShop(themeModalShop.slug, { logoUrl: '' });
                      setThemeModalShop({ ...themeModalShop, logoUrl: '' });
                    }}
                    style={{ fontSize: '11px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setThemeModalShop(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done & Save
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal: Confirmation for Factory Reset before going out and selling */}
      {isResetConfirmModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: '#18181B',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '26px',
            padding: '28px 24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 40px rgba(239, 68, 68, 0.15)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '18px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 850, color: '#FAFAFA', margin: '0 0 6px' }}>
              Factory Reset Platform?
            </h3>
            <p style={{ fontSize: '13px', color: '#A1A1AA', lineHeight: 1.5, margin: '0 0 20px' }}>
              This will wipe all test shops, mock check-in records, and test booth rent receipts. It will restore a clean slate with only <strong>OF Supply & Lounge</strong> ready for live customer demonstrations and sales pitches.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setIsResetConfirmModalOpen(false)}
                style={{
                  padding: '12px',
                  background: '#27272A',
                  border: '1px solid #3F3F46',
                  color: '#D4D4D8',
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
                  padding: '12px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 850,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(239, 68, 68, 0.35)'
                }}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
