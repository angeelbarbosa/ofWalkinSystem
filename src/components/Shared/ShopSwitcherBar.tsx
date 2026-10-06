import { useState } from 'react';
import { ChevronDown, Check, Plus, Shield } from 'lucide-react';
import type { Shop, MainNavTab } from '../../types';
import { THEME_PRESETS } from '../../utils/themes';

interface ShopSwitcherBarProps {
  currentShop: Shop;
  shops: Shop[];
  onSwitchShop: (slug: string) => void;
  onNavigateTab: (tab: MainNavTab) => void;
  onOpenNewShopModal?: () => void;
}

export function ShopSwitcherBar({
  currentShop,
  shops,
  onSwitchShop,
  onNavigateTab,
  onOpenNewShopModal
}: ShopSwitcherBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const theme = THEME_PRESETS[currentShop.themeId] || THEME_PRESETS.midnight_gold;

  return (
    <div style={{ position: 'relative', zIndex: 60 }}>
      {/* Active Shop Indicator Badge / Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'var(--surface-pill, rgba(255, 255, 255, 0.08))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: theme.previewColor,
            boxShadow: `0 0 8px ${theme.previewColor}`
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {currentShop.name}
        </span>
        <span
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 6px',
            borderRadius: '4px',
            background: theme.accentLight,
            color: theme.accentColor,
            fontWeight: 800
          }}
        >
          {currentShop.slug}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 70
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              minWidth: '280px',
              maxWidth: '340px',
              background: 'var(--surface-card, #18181B)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
              borderRadius: '16px',
              padding: '8px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              zIndex: 80,
              animation: 'slideUp 0.2s ease forwards'
            }}
          >
            <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                WalkinApp Barbershop Fleet
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Switch active location or manage fleet
              </p>
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '6px 0' }}>
              {shops.map((shop) => {
                const isSelected = shop.slug === currentShop.slug;
                const shopTheme = THEME_PRESETS[shop.themeId] || THEME_PRESETS.midnight_gold;

                return (
                  <button
                    key={shop.id}
                    onClick={() => {
                      onSwitchShop(shop.slug);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--accent-primary-light, rgba(255,255,255,0.08))' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: shopTheme.previewColor,
                          boxShadow: `0 0 6px ${shopTheme.previewColor}`
                        }}
                      />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {shop.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                          {shop.barbers?.length || 0} barbers • {shop.slug}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: shopTheme.accentColor }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {onOpenNewShopModal && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenNewShopModal();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} style={{ color: 'var(--accent-primary)' }} />
                  + Add New Barbershop
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateTab('super_admin');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: '#F59E0B',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Shield size={14} />
                Master Super Admin Command Center
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
