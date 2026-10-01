import React, { useState, useEffect } from 'react';
import { Scissors, Smartphone, Sliders, Bell } from 'lucide-react';
import type { MainNavTab, ShopConfig } from '../../types';

interface HeaderProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  config: ShopConfig;
  onRequestUnlock: () => void;
  isKioskLocked: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  config,
  onRequestUnlock,
  isKioskLocked
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab: MainNavTab) => {
    if (isKioskLocked && currentTab === 'kiosk' && tab !== 'kiosk') {
      onRequestUnlock();
      return;
    }
    onSelectTab(tab);
  };

  return (
    <header className="header-bar">
      {/* Brand */}
      <div className="header-brand">
        <div className="brand-icon-bubble">
          <Scissors size={22} />
        </div>
        <div className="brand-titles">
          <h1 className="brand-name">{config.shopName}</h1>
          <span className="brand-sub">{config.tagline}</span>
        </div>
      </div>

      {/* Center Live Indicator */}
      <div className="header-center-pill">
        <div className="live-dot" />
        <span>Kiosk Live</span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ fontWeight: 800, color: '#0F172A' }}>{timeStr}</span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Navigation Pills */}
        <div className="header-nav-pills">
          <button
            type="button"
            className={`nav-pill-btn ${currentTab === 'kiosk' ? 'active' : ''}`}
            onClick={() => handleTabClick('kiosk')}
            title="Front Door Kiosk for Clients"
          >
            <Smartphone size={16} />
            <span>Kiosk</span>
          </button>

          <button
            type="button"
            className={`nav-pill-btn ${currentTab === 'barber_portal' ? 'active' : ''}`}
            onClick={() => handleTabClick('barber_portal')}
            title="Barber Live Alerts & Station Screen"
          >
            <Bell size={16} />
            <span>Barber Hub</span>
          </button>

          <button
            type="button"
            className={`nav-pill-btn ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabClick('admin')}
            title="Shop Settings & Check-in History"
          >
            <Sliders size={16} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
