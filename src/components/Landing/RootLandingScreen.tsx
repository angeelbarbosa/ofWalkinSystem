import React, { useState } from 'react';
import { 
  Scissors, 
  Store, 
  Shield, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import type { Shop, MainNavTab } from '../../types';
import { applyTheme, type ThemeId } from '../../utils/themes';

interface RootLandingScreenProps {
  shops: Shop[];
  onSelectShop: (slug: string, targetPortal?: MainNavTab) => void;
  onOpenSuperAdmin: () => void;
}

export const RootLandingScreen: React.FC<RootLandingScreenProps> = ({
  shops,
  onSelectShop,
  onOpenSuperAdmin
}) => {
  const [searchCode, setSearchCode] = useState('');
  const [searchError, setSearchError] = useState('');
  const [activeTheme, setActiveTheme] = useState<'clean_studio' | 'obsidian_noir'>('obsidian_noir');

  const handleToggleTheme = () => {
    const nextTheme: ThemeId = activeTheme === 'clean_studio' ? 'obsidian_noir' : 'clean_studio';
    setActiveTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!query) {
      setSearchError('Please enter a barbershop code');
      return;
    }

    const found = shops.find(s => s.slug.toLowerCase() === query || s.name.toLowerCase().includes(query));
    if (found) {
      setSearchError('');
      onSelectShop(found.slug, 'kiosk');
    } else {
      setSearchError(`No barbershop found with code "${query}". Check your direct link.`);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      padding: 'max(48px, calc(env(safe-area-inset-top, 0px) + 20px)) 16px max(80px, env(safe-area-inset-bottom, 32px)) 16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Top Header Bar */}
      <div style={{
        width: '100%',
        maxWidth: '580px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--accent-primary)',
            color: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scissors size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
              WalkinApp
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              Barbershop Platform
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme Switcher Pill */}
          <button
            onClick={handleToggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'var(--surface-pill)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            {activeTheme === 'clean_studio' ? (
              <Moon size={13} style={{ color: 'var(--text-primary)' }} />
            ) : (
              <Sun size={13} style={{ color: '#F59E0B' }} />
            )}
            <span>{activeTheme === 'clean_studio' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Master Admin Discreet Icon */}
          <button
            onClick={onOpenSuperAdmin}
            title="Platform HQ (PIN Required)"
            style={{
              padding: '7px',
              borderRadius: '10px',
              background: 'var(--surface-pill)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Lock size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '580px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        margin: 'auto 0'
      }}>
        {/* Welcome Banner Card */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'var(--pastel-amber-bg)',
            border: '1px solid var(--pastel-amber-border)',
            color: 'var(--pastel-amber)',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '12px'
          }}>
            <Sparkles size={12} />
            <span>Kiosk & Barber Station Portal</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Welcome to WalkinApp
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
            Each barbershop has a dedicated private link. Enter your shop code below or select your location to jump into your kiosk.
          </p>

          {/* Shop Code Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--surface-pill)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '6px 6px 6px 14px',
              boxSizing: 'border-box'
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Enter shop code (e.g. 'of' or 'fademasters')"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setSearchError('');
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  minWidth: 0
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0
                }}
              >
                <span>Launch</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {searchError && (
              <p style={{ color: 'var(--pastel-red)', fontSize: '12px', fontWeight: 700, margin: '2px 0 0' }}>
                {searchError}
              </p>
            )}
          </form>
        </div>

        {/* Quick Launch Locations Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Active Barbershop Locations ({shops.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shops.map((shop) => (
              <div
                key={shop.id}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '18px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  {shop.logoUrl ? (
                    <img
                      src={shop.logoUrl}
                      alt={shop.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        objectFit: 'contain',
                        background: '#FFFFFF',
                        padding: '2px',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'var(--surface-pill)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      flexShrink: 0
                    }}>
                      {shop.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {shop.name}
                      </h3>
                      {shop.slug === 'of' && (
                        <span style={{
                          fontSize: '8px',
                          padding: '2px 5px',
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
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Code: ?shop={shop.slug} • {shop.barbers?.length || 0} Barbers
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => onSelectShop(shop.slug, 'kiosk')}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--accent-primary)',
                      color: 'var(--bg-main)',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Store size={12} />
                    <span>Kiosk</span>
                  </button>

                  <button
                    onClick={() => onSelectShop(shop.slug, 'barber_portal')}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--surface-pill)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Scissors size={12} />
                    <span>Staff</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discreet Bottom Bar: Platform HQ Entry */}
      <div style={{
        width: '100%',
        maxWidth: '580px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '20px'
      }}>
        <button
          onClick={onOpenSuperAdmin}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Shield size={13} style={{ color: 'var(--pastel-amber)' }} />
          <span>Platform Owner HQ (Master PIN: 9999)</span>
        </button>
      </div>
    </div>
  );
};
