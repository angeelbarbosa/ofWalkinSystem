import type { Shop } from '../../types';

interface ShopSwitcherBarProps {
  currentShop: Shop;
}

/**
 * Privacy-First Shop Identity Badge
 * Displays ONLY the current shop's name and active status.
 * Never leaks other barbershop accounts or platform admin links to individual shop staff.
 */
export function ShopSwitcherBar({ currentShop }: ShopSwitcherBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        background: 'var(--surface-pill)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '9999px',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
        minWidth: 0,
        flex: 1,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: 'var(--pastel-green)',
          boxShadow: '0 0 6px var(--pastel-green)',
          flexShrink: 0
        }}
      />
      <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
        {currentShop.name}
      </span>
      <span
        style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '1px 5px',
          borderRadius: '4px',
          background: 'var(--surface-card-subtle)',
          color: 'var(--text-muted)',
          fontWeight: 800,
          flexShrink: 0
        }}
      >
        {currentShop.slug}
      </span>
    </div>
  );
}
