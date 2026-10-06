export type ThemeId = 
  | 'clean_studio' 
  | 'obsidian_noir'
  // Legacy aliases mapped smoothly
  | 'midnight_gold' 
  | 'obsidian_emerald' 
  | 'classic_heritage' 
  | 'cyber_slate' 
  | 'rose_gold';

export interface ThemePreset {
  id: 'clean_studio' | 'obsidian_noir';
  name: string;
  tagline: string;
  badgeBg: string;
  previewColor: string;
  accentColor: string;
  secondaryAccent: string;
  bgMain: string;
  bgGradient: string;
  surfaceCard: string;
  surfaceCardSubtle: string;
  surfacePill: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderDark: string;
  accentPrimary: string;
  accentHover: string;
  accentLight: string;
  pastelGreen: string;
  pastelGreenBg: string;
  pastelGreenBorder: string;
  pastelRed: string;
  pastelRedBg: string;
  pastelRedBorder: string;
  pastelAmber: string;
  pastelAmberBg: string;
  pastelAmberBorder: string;
  pastelBlue: string;
  pastelBlueBg: string;
  pastelBlueBorder: string;
  glassReflection: string;
  shadowBubble: string;
}

const clean_studio: ThemePreset = {
  id: 'clean_studio',
  name: 'Studio Light',
  tagline: 'Ultra-clean studio white with deep ink accents & reflective glass bubbles',
  badgeBg: '#18181B',
  previewColor: '#09090B',
  accentColor: '#09090B',
  secondaryAccent: '#52525B',
  bgMain: '#F8F9FB',
  bgGradient: '#F8F9FB',
  surfaceCard: '#FFFFFF',
  surfaceCardSubtle: '#F4F4F6',
  surfacePill: '#F1F3F5',
  textPrimary: '#09090B',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  borderSubtle: 'rgba(0, 0, 0, 0.08)',
  borderDark: '#E4E4E7',
  accentPrimary: '#09090B',
  accentHover: '#27272A',
  accentLight: 'rgba(9, 9, 11, 0.06)',
  pastelGreen: '#10B981',
  pastelGreenBg: '#ECFDF5',
  pastelGreenBorder: '#A7F3D0',
  pastelRed: '#EF4444',
  pastelRedBg: '#FEF2F2',
  pastelRedBorder: '#FECDD3',
  pastelAmber: '#F59E0B',
  pastelAmberBg: '#FFFBEB',
  pastelAmberBorder: '#FDE68A',
  pastelBlue: '#0284C7',
  pastelBlueBg: '#F0F9FF',
  pastelBlueBorder: '#BAE6FD',
  glassReflection: 'inset 0 1px 2px rgba(255, 255, 255, 0.9), 0 8px 24px rgba(0, 0, 0, 0.04)',
  shadowBubble: '0 12px 32px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
};

const obsidian_noir: ThemePreset = {
  id: 'obsidian_noir',
  name: 'Obsidian Dark',
  tagline: 'Stealth matte obsidian black with reflective glass pills & vibrant pastel accents',
  badgeBg: '#FAFAFA',
  previewColor: '#FAFAFA',
  accentColor: '#FAFAFA',
  secondaryAccent: '#A1A1AA',
  bgMain: '#09090B',
  bgGradient: '#09090B',
  surfaceCard: '#141417',
  surfaceCardSubtle: '#1C1C21',
  surfacePill: '#222227',
  textPrimary: '#FAFAFA',
  textSecondary: '#D4D4D8',
  textMuted: '#A1A1AA',
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  borderDark: '#27272A',
  accentPrimary: '#FAFAFA',
  accentHover: '#E4E4E7',
  accentLight: 'rgba(255, 255, 255, 0.12)',
  pastelGreen: '#34D399',
  pastelGreenBg: 'rgba(52, 211, 153, 0.12)',
  pastelGreenBorder: 'rgba(52, 211, 153, 0.28)',
  pastelRed: '#FB7185',
  pastelRedBg: 'rgba(251, 113, 133, 0.12)',
  pastelRedBorder: 'rgba(251, 113, 133, 0.28)',
  pastelAmber: '#FBBF24',
  pastelAmberBg: 'rgba(251, 191, 36, 0.12)',
  pastelAmberBorder: 'rgba(251, 191, 36, 0.28)',
  pastelBlue: '#38BDF8',
  pastelBlueBg: 'rgba(56, 189, 248, 0.12)',
  pastelBlueBorder: 'rgba(56, 189, 248, 0.28)',
  glassReflection: 'inset 0 1px 1px rgba(255, 255, 255, 0.16), 0 8px 24px rgba(0, 0, 0, 0.5)',
  shadowBubble: '0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
};

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  clean_studio,
  obsidian_noir,
  midnight_gold: obsidian_noir,
  obsidian_emerald: obsidian_noir,
  classic_heritage: clean_studio,
  cyber_slate: obsidian_noir,
  rose_gold: clean_studio
};

// Map any legacy theme keys to either clean_studio or obsidian_noir
export function resolveTheme(themeId?: string): ThemePreset {
  if (themeId === 'clean_studio' || themeId === 'classic_heritage' || themeId === 'rose_gold') {
    return THEME_PRESETS.clean_studio;
  }
  // Default to Obsidian Dark for all dark variants
  return THEME_PRESETS.obsidian_noir;
}

export function applyTheme(themeId: ThemeId = 'clean_studio') {
  const theme = resolveTheme(themeId);
  const root = document.documentElement;

  root.style.setProperty('--bg-main', theme.bgMain);
  root.style.setProperty('--bg-gradient', theme.bgGradient);
  root.style.setProperty('--surface-card', theme.surfaceCard);
  root.style.setProperty('--surface-card-subtle', theme.surfaceCardSubtle);
  root.style.setProperty('--surface-pill', theme.surfacePill);
  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--border-subtle', theme.borderSubtle);
  root.style.setProperty('--border-dark', theme.borderDark);
  root.style.setProperty('--accent-primary', theme.accentPrimary);
  root.style.setProperty('--accent-primary-hover', theme.accentHover);
  root.style.setProperty('--accent-primary-light', theme.accentLight);
  root.style.setProperty('--brand-accent', theme.accentColor);

  // Pastel Color Variables
  root.style.setProperty('--pastel-green', theme.pastelGreen);
  root.style.setProperty('--pastel-green-bg', theme.pastelGreenBg);
  root.style.setProperty('--pastel-green-border', theme.pastelGreenBorder);
  root.style.setProperty('--pastel-red', theme.pastelRed);
  root.style.setProperty('--pastel-red-bg', theme.pastelRedBg);
  root.style.setProperty('--pastel-red-border', theme.pastelRedBorder);
  root.style.setProperty('--pastel-amber', theme.pastelAmber);
  root.style.setProperty('--pastel-amber-bg', theme.pastelAmberBg);
  root.style.setProperty('--pastel-amber-border', theme.pastelAmberBorder);
  root.style.setProperty('--pastel-blue', theme.pastelBlue);
  root.style.setProperty('--pastel-blue-bg', theme.pastelBlueBg);
  root.style.setProperty('--pastel-blue-border', theme.pastelBlueBorder);

  // Bubbly Reflection Tokens
  root.style.setProperty('--glass-reflection', theme.glassReflection);
  root.style.setProperty('--shadow-bubble', theme.shadowBubble);

  // Set meta theme-color for iOS/Android status bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.bgMain);
  }
}
