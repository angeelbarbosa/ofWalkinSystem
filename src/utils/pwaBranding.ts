import type { Shop } from '../types';
import { THEME_PRESETS } from './themes';

/**
 * Dynamically generates a high-res 512x512 PNG app icon for iOS / Android Home Screen
 * using HTML5 Canvas when the shop doesn't have an uploaded logo image.
 */
function generateShopAppIconDataUrl(shopName: string, themeColor: string, bgColor: string): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Background with subtle radial luxury gradient
  const grad = ctx.createRadialGradient(256, 180, 40, 256, 256, 320);
  grad.addColorStop(0, '#27272A');
  grad.addColorStop(1, bgColor || '#09090B');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 512, 110);
  ctx.fill();

  // 2. Outer decorative ring in theme accent color
  ctx.strokeStyle = themeColor || '#F59E0B';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.roundRect(24, 24, 464, 464, 90);
  ctx.stroke();

  // 3. Draw Barber Scissor / Crown Graphic
  ctx.fillStyle = themeColor || '#F59E0B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 4. Shop Initials
  const words = shopName.trim().split(/\s+/);
  const initials = words.length >= 2 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : shopName.substring(0, 2).toUpperCase();

  ctx.font = '900 140px "Outfit", sans-serif';
  ctx.fillText(initials, 256, 230);

  // 5. Shop Subtitle Tag
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FAFAFA';
  const cleanSub = words.length > 2 ? words.slice(0, 2).join(' ') : shopName;
  ctx.fillText(cleanSub.substring(0, 16).toUpperCase(), 256, 350);

  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = themeColor || '#F59E0B';
  ctx.fillText('WALKIN APP', 256, 400);

  return canvas.toDataURL('image/png');
}

/**
 * Updates browser tab title, Apple Touch Icon, meta tags, and PWA manifest
 * so when any client or owner taps "Add to Home Screen", iOS/Android saves
 * the EXACT shop name and custom logo.
 */
export function updatePwaBranding(shop: Shop) {
  if (typeof document === 'undefined') return;

  const theme = THEME_PRESETS[shop.themeId] || THEME_PRESETS.midnight_gold;

  // 1. Update Document Title
  document.title = `${shop.name} — WalkinApp`;

  // 2. Update Apple Mobile Web App Title
  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    appleTitleMeta.setAttribute('name', 'apple-mobile-web-app-title');
    document.head.appendChild(appleTitleMeta);
  }
  appleTitleMeta.setAttribute('content', shop.name);

  // 3. Update Application Name Meta
  let appNameMeta = document.querySelector('meta[name="application-name"]');
  if (!appNameMeta) {
    appNameMeta = document.createElement('meta');
    appNameMeta.setAttribute('name', 'application-name');
    document.head.appendChild(appNameMeta);
  }
  appNameMeta.setAttribute('content', shop.name);

  // 4. Update Theme Color Meta for Status Bar
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme.bgMain);
  }

  // 5. Determine Icon URL (Uploaded logo or auto-generated branded canvas icon)
  let iconUrl = shop.logoUrl;
  if (!iconUrl || iconUrl.trim() === '') {
    iconUrl = generateShopAppIconDataUrl(shop.name, theme.previewColor, theme.bgMain);
  }

  // 6. Update Apple Touch Icon (<link rel="apple-touch-icon">)
  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.setAttribute('href', iconUrl);

  // 7. Update Standard Favicon
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.setAttribute('rel', 'icon');
    document.head.appendChild(favicon);
  }
  favicon.setAttribute('href', iconUrl);

  // 8. Generate Dynamic PWA Manifest for Android / Chrome
  try {
    const manifestObj = {
      name: shop.name,
      short_name: shop.name.length > 12 ? shop.name.substring(0, 12) : shop.name,
      description: shop.tagline || 'Intelligent Customer Kiosk & Barber Hub',
      start_url: `/?shop=${shop.slug}`,
      display: 'standalone',
      background_color: theme.bgMain,
      theme_color: theme.bgMain,
      icons: [
        {
          src: iconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestObj)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', manifestUrl);
  } catch (err) {
    console.warn('Could not update dynamic manifest:', err);
  }
}
