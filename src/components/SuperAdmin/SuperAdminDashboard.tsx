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
  Scissors, 
  Lock, 
  Sparkles, 
  Trash2, 
  LogOut, 
  RotateCcw, 
  RefreshCw, 
  AlertTriangle,
  Sun,
  Moon
} from 'lucide-react';
import type { Shop, MainNavTab } from '../../types';
import { applyTheme, type ThemeId } from '../../utils/themes';
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
  const [deleteConfirmShop, setDeleteConfirmShop] = useState<Shop | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Shop Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newTheme, setNewTheme] = useState<ThemeId>('obsidian_noir');
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
      setNewSlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    }
  };

  // Submit New Barbershop Creation
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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://of-walkin-system.vercel.app';
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
    showToast('Platform reset to clean launch state (OF Supply only).');
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
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-gradient)',
        padding: '20px 16px',
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
            Enter your Master PIN to access and manage your barbershop fleet.
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
      background: 'var(--bg-gradient)',
      color: 'var(--text-primary)',
      padding: '20px 14px',
      paddingBottom: 'max(120px, env(safe-area-inset-bottom, 32px))',
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

      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '22px'
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
                  WalkinApp HQ
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Fleet Management & Kiosk Controls
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

          {/* Action Buttons: Add Shop, Load Demo Fleet, Factory Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsNewShopModalOpen(true)}
              style={{
                flex: '1 1 auto',
                minWidth: '130px',
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

            {/* Test Fleet Button */}
            <button
              onClick={handleExecuteDemoFleetReload}
              title="Load 3 demo test shops (OF Supply, Fade Masters, Royal Cuts)"
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
              <RefreshCw size={13} style={{ color: 'var(--pastel-amber)' }} />
              <span>Demo Fleet</span>
            </button>

            {/* Factory Reset for Sales Button */}
            <button
              onClick={() => setIsResetConfirmModalOpen(true)}
              title="Reset platform to clean initial launch state before selling"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '11px 14px',
                background: 'var(--pastel-red-bg)',
                border: '1px solid var(--pastel-red-border)',
                color: 'var(--pastel-red)',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Clean Slate</span>
            </button>
          </div>
        </div>

        {/* 2x2 Compact KPI Stats Grid (4 columns on desktop) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '24px'
        }}>
          {/* Stat 1: Active Shops */}
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--pastel-blue-bg)',
              border: '1px solid var(--pastel-blue-border)',
              color: 'var(--pastel-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Store size={18} />
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Active Shops
              </p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                {totalShops}
              </p>
            </div>
          </div>

          {/* Stat 2: Total Barbers */}
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--pastel-green-bg)',
              border: '1px solid var(--pastel-green-border)',
              color: 'var(--pastel-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Users size={18} />
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Total Barbers
              </p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                {totalBarbers}
              </p>
            </div>
          </div>

          {/* Stat 3: SaaS MRR */}
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--pastel-amber-bg)',
              border: '1px solid var(--pastel-amber-border)',
              color: 'var(--pastel-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <DollarSign size={18} />
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                SaaS Revenue
              </p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                ${totalEstimatedMRR} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>/mo</span>
              </p>
            </div>
          </div>

          {/* Stat 4: Queue Today */}
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--pastel-blue-bg)',
              border: '1px solid var(--pastel-blue-border)',
              color: 'var(--pastel-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                Queue Today
              </p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: '1px 0 0' }}>
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
          marginBottom: '14px'
        }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
              Barbershop Fleet ({shops.length})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Select any shop to launch its kiosk, switch colorway, or copy direct link
            </p>
          </div>
        </div>

        {/* Shop Cards List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '12px'
        }}>
          {shops.map((shop) => {
            const isCurrentlyActive = shop.slug === activeShopSlug;
            const barbersCount = shop.barbers?.length || 0;
            const walkInsCount = shop.checkIns?.length || 0;

            return (
              <div
                key={shop.id}
                style={{
                  background: 'var(--surface-card)',
                  border: isCurrentlyActive 
                    ? '2px solid var(--text-primary)' 
                    : '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                {/* Shop Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
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
                          fontSize: '15px',
                          flexShrink: 0
                        }}
                      >
                        {shop.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shop.name}
                        </h3>
                        {shop.slug === 'of' && (
                          <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--pastel-amber-bg)',
                            color: 'var(--pastel-amber)',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            FLAGSHIP
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {shop.address || 'Address Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Theme Badge (Click to open theme picker) */}
                  <button
                    onClick={() => setThemeModalShop(shop)}
                    title="Change Colorway"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
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
                    <span>{shop.themeId === 'clean_studio' ? 'Studio Light' : 'Obsidian Dark'}</span>
                  </button>
                </div>

                {/* Info Pills Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  background: 'var(--surface-pill)',
                  borderRadius: '12px',
                  padding: '8px 10px'
                }}>
                  <div>
                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>
                      Link Code
                    </p>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                      ?shop={shop.slug}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>
                      Barbers
                    </p>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', margin: '1px 0 0' }}>
                      {barbersCount} Chairs
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>
                      Queue
                    </p>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--pastel-green)', margin: '1px 0 0' }}>
                      {walkInsCount} Waiting
                    </p>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      onSwitchShop(shop.slug);
                      onNavigateTab('kiosk');
                    }}
                    style={{
                      flex: '1 1 auto',
                      padding: '9px 12px',
                      background: 'var(--accent-primary)',
                      color: 'var(--bg-main)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      border: 'none'
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
                      padding: '9px 12px',
                      background: 'var(--surface-pill)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Scissors size={13} />
                    <span>Barbers</span>
                  </button>

                  <button
                    onClick={() => handleCopyKioskLink(shop.slug)}
                    title="Copy direct link"
                    style={{
                      padding: '9px 12px',
                      background: 'var(--surface-pill)',
                      border: '1px solid var(--border-subtle)',
                      color: copiedSlug === shop.slug ? 'var(--pastel-green)' : 'var(--text-secondary)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedSlug === shop.slug ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedSlug === shop.slug ? 'Copied' : 'Link'}</span>
                  </button>

                  {/* Delete Shop Button */}
                  <button
                    onClick={() => setDeleteConfirmShop(shop)}
                    title="Delete Barbershop"
                    style={{
                      padding: '9px 10px',
                      background: 'var(--pastel-red-bg)',
                      border: '1px solid var(--pastel-red-border)',
                      color: 'var(--pastel-red)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
          boxSizing: 'border-box'
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
                <div style={{ padding: '7px', background: 'var(--surface-pill)', color: 'var(--text-primary)', borderRadius: '10px' }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                    Add Barbershop
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>
                    Create a new shop tenant in seconds
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
              <div style={{ padding: '9px 12px', background: 'var(--pastel-red-bg)', border: '1px solid var(--pastel-red-border)', borderRadius: '12px', color: 'var(--pastel-red)', fontSize: '12px', marginBottom: '12px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateShopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Crown & Blade Barber Lounge"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 13px',
                    background: 'var(--surface-pill)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Link Slug *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
                  <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>
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
                      padding: '11px 13px 11px 0',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Colorway *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNewTheme('clean_studio')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      border: newTheme === 'clean_studio' ? '2px solid #09090B' : '1px solid #E4E4E7',
                      color: '#09090B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Sun size={14} style={{ color: '#F59E0B' }} />
                    <span>Studio Light</span>
                    {newTheme === 'clean_studio' && <Check size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTheme('obsidian_noir')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#09090B',
                      border: newTheme === 'obsidian_noir' ? '2px solid #FAFAFA' : '1px solid #27272A',
                      color: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Moon size={14} />
                    <span>Obsidian Dark</span>
                    {newTheme === 'obsidian_noir' && <Check size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Location Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 520 Main Street, Suite 4B"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 13px',
                    background: 'var(--surface-pill)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Owner PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      background: 'var(--surface-pill)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Monthly Plan ($)
                  </label>
                  <input
                    type="number"
                    value={newMonthlyPrice}
                    onChange={(e) => setNewMonthlyPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '11px 13px',
                      background: 'var(--surface-pill)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '6px',
                  padding: '13px',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Sparkles size={16} />
                Create Barbershop
              </button>
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
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '26px',
            padding: '24px 20px',
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
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  border: themeModalShop.themeId === 'clean_studio' ? '2.5px solid #09090B' : '1px solid #E4E4E7',
                  color: '#09090B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#F4F4F6',
                    border: '1px solid #E4E4E7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#09090B'
                  }}>
                    <Sun size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#09090B', margin: 0 }}>
                      Studio Light
                    </p>
                    <p style={{ fontSize: '11px', color: '#71717A', margin: 0 }}>
                      Crisp minimal white with deep ink typography
                    </p>
                  </div>
                </div>
                {themeModalShop.themeId === 'clean_studio' && (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#09090B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} />
                  </div>
                )}
              </button>

              {/* Option 2: Obsidian Dark */}
              <button
                onClick={() => {
                  onUpdateShop(themeModalShop.slug, { themeId: 'obsidian_noir' });
                  applyTheme('obsidian_noir');
                  setThemeModalShop({ ...themeModalShop, themeId: 'obsidian_noir' });
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: '#09090B',
                  border: themeModalShop.themeId !== 'clean_studio' ? '2.5px solid #FAFAFA' : '1px solid #27272A',
                  color: '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#18181B',
                    border: '1px solid #27272A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FAFAFA'
                  }}>
                    <Moon size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#FAFAFA', margin: 0 }}>
                      Obsidian Dark
                    </p>
                    <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0 }}>
                      Stealth matte black with glowing glass pills
                    </p>
                  </div>
                </div>
                {themeModalShop.themeId !== 'clean_studio' && (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FAFAFA', color: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} />
                  </div>
                )}
              </button>
            </div>

            {/* Custom Logo Upload */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface-pill)', border: '1px solid var(--border-subtle)', borderRadius: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Custom Shop Logo
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
                    padding: '9px 11px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <label
                  style={{
                    padding: '9px 12px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upload
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <img
                    src={themeModalShop.logoUrl}
                    alt="Logo preview"
                    style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '8px', background: '#FFFFFF', padding: '2px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--pastel-green)', fontWeight: 700 }}>Custom Logo Active</span>
                  <button
                    onClick={() => {
                      onUpdateShop(themeModalShop.slug, { logoUrl: '' });
                      setThemeModalShop({ ...themeModalShop, logoUrl: '' });
                    }}
                    style={{ fontSize: '11px', color: 'var(--pastel-red)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', fontWeight: 700 }}
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
                background: 'var(--accent-primary)',
                color: 'var(--bg-main)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Done & Save
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
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: 'var(--surface-card)',
            border: '1px solid var(--pastel-red-border)',
            borderRadius: '24px',
            padding: '24px 20px',
            boxShadow: 'var(--shadow-bubble)',
            textAlign: 'center'
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
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--surface-card)',
            border: '1px solid var(--pastel-red-border)',
            borderRadius: '26px',
            padding: '26px 20px',
            boxShadow: 'var(--shadow-bubble)',
            textAlign: 'center'
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
              This will wipe all test shops and mock check-in records, leaving only <strong>OF Supply & Lounge</strong> ready for fresh sales presentations.
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
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
