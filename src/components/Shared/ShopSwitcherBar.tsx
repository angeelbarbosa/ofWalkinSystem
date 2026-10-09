import { useState } from 'react';
import type { Shop } from '../../types';

interface ShopSwitcherBarProps {
  currentShop: Shop;
}

/**
 * Shop Identity Badge / Logo
 * Displays the shop's official brand logo at the top center of the app.
 * If no logo exists or fails to load, gracefully falls back to a compact name pill.
 */
export function ShopSwitcherBar({ currentShop }: ShopSwitcherBarProps) {
  const [imgError, setImgError] = useState(false);

  const rawLogo = currentShop?.logoUrl || currentShop?.config?.logoUrl || (currentShop?.slug === 'of' ? '/logo.png' : undefined);
  const hasLogo = !!rawLogo && !imgError;
  const isDefaultOfLogo = rawLogo === '/logo.png' || (rawLogo?.includes('logo.png') ?? false);

  if (hasLogo && rawLogo) {
    return (
      <div
        className="shop-header-logo-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          padding: '2px 6px',
          maxHeight: '34px'
        }}
        title={currentShop.name}
      >
        <img
          src={rawLogo}
          alt={currentShop.name}
          onError={() => setImgError(true)}
          className={`shop-header-logo ${isDefaultOfLogo ? 'is-default-logo' : ''}`}
          style={{
            height: '28px',
            maxWidth: '110px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
    );
  }

  // Clean fallback when shop has no logo (no oversized overflowing dots or badges)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 12px',
        background: 'var(--surface-pill)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '9999px',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
        maxWidth: '160px',
        minWidth: 0,
        overflow: 'hidden'
      }}
      title={currentShop.name}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {currentShop.name}
      </span>
    </div>
  );
}
