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
        gap: '8px',
        padding: '6px 14px',
        background: 'var(--surface-pill)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '9999px',
        backdropFilter: 'blur(8px)',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--pastel-green)',
          boxShadow: '0 0 6px var(--pastel-green)'
        }}
      />
      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
        {currentShop.name}
      </span>
      <span
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'var(--surface-card-subtle)',
          color: 'var(--text-muted)',
          fontWeight: 800
        }}
      >
        {currentShop.slug}
      </span>
    </div>
  );
}
