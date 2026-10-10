import React, { useState } from 'react';
import { 
  Scissors, 
  Store, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import type { Shop, MainNavTab } from '../../types';
import { applyTheme, type ThemeId } from '../../utils/themes';
import { WalkingLegsIcon } from '../Shared/WalkingLegsIcon';

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
  const [targetMode, setTargetMode] = useState<'kiosk' | 'barber_portal' | 'admin'>('kiosk');

  const handleToggleTheme = () => {
    const nextTheme: ThemeId = activeTheme === 'clean_studio' ? 'obsidian_noir' : 'clean_studio';
    setActiveTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!query) {
      setSearchError('Please enter your barbershop code');
      return;
    }

    const found = shops.find(s => s.slug.toLowerCase() === query || s.name.toLowerCase().includes(query));
    if (found) {
      setSearchError('');
      onSelectShop(found.slug, targetMode);
    } else {
      setSearchError(`No barbershop found matching code "${query}". Please check your link.`);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: 'var(--bg-main)',
      color: 'var(--text-primary)',
      padding: 'max(48px, calc(env(safe-area-inset-top, 0px) + 20px)) 16px max(60px, env(safe-area-inset-bottom, 32px)) 16px',
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
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
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
            <WalkingLegsIcon size={22} strokeWidth={2.4} />
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

      {/* Centered Single Access Card */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        margin: 'auto 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '26px',
          padding: '30px 22px',
          boxShadow: 'var(--shadow-bubble)',
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
            marginBottom: '14px'
          }}>
            <Sparkles size={12} />
            <span>Private Barbershop Access</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Enter Barbershop Code
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Please enter your barbershop code below to access your digital kiosk or staff hub.
          </p>

          {/* Mode Selector Pill (Kiosk / Barber Hub / Admin) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-pill)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '18px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setTargetMode('kiosk')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: targetMode === 'kiosk' ? 'var(--accent-primary)' : 'transparent',
                color: targetMode === 'kiosk' ? 'var(--bg-main)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Store size={13} />
              <span>Kiosk</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode('barber_portal')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: targetMode === 'barber_portal' ? 'var(--accent-primary)' : 'transparent',
                color: targetMode === 'barber_portal' ? 'var(--bg-main)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Scissors size={13} />
              <span>Barbers</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetMode('admin')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '10px',
                border: 'none',
                background: targetMode === 'admin' ? 'var(--accent-primary)' : 'transparent',
                color: targetMode === 'admin' ? 'var(--bg-main)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <Lock size={12} />
              <span>Admin</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--surface-pill)',
              border: searchError ? '2px solid var(--pastel-red)' : '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '6px 6px 6px 16px',
              boxSizing: 'border-box'
            }}>
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Enter code (e.g. demo or of)"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setSearchError('');
                }}
                autoFocus
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: 700,
                  outline: 'none',
                  minWidth: 0
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 20px',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-main)',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}
              >
                <span>Launch</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick Demo & Live Shops Shortcuts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => onSelectShop('demo', targetMode)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={12} />
                <span>🎯 Quick Demo (The Showcase Lounge)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectShop('of', targetMode)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: 'var(--surface-pill)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Scissors size={12} />
                <span>OF Supply & Lounge</span>
              </button>
            </div>

            {searchError && (
              <p style={{ color: 'var(--pastel-red)', fontSize: '12px', fontWeight: 700, margin: '2px 0 0' }}>
                {searchError}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Discreet Platform HQ Link */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)'
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
          <WalkingLegsIcon size={14} strokeWidth={2.4} style={{ color: 'var(--pastel-amber)' }} />
          <span>Platform Owner HQ (Master PIN: 9999)</span>
        </button>
      </div>
    </div>
  );
};
