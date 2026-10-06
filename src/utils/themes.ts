export type ThemeId = 
  | 'midnight_gold' 
  | 'obsidian_emerald' 
  | 'classic_heritage' 
  | 'cyber_slate' 
  | 'rose_gold' 
  | 'clean_studio';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  tagline: string;
  badgeBg: string;
  previewColor: string;
  accentColor: string;
  secondaryAccent: string;
  bgMain: string;
  bgGradient: string;
  surfaceCard: string;
  surfacePill: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderDark: string;
  accentPrimary: string;
  accentHover: string;
  accentLight: string;
}

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  midnight_gold: {
    id: 'midnight_gold',
    name: 'Midnight Gold',
    tagline: 'Luxury carbon black with metallic gold accents',
    badgeBg: '#CA8A04',
    previewColor: '#F59E0B',
    accentColor: '#F59E0B',
    secondaryAccent: '#D97706',
    bgMain: '#09090B',
    bgGradient: 'radial-gradient(circle at 50% 0%, #1C1917 0%, #09090B 75%, #050507 100%)',
    surfaceCard: '#18181B',
    surfacePill: '#27272A',
    textPrimary: '#FAFAFA',
    textSecondary: '#D4D4D8',
    textMuted: '#A1A1AA',
    borderSubtle: 'rgba(245, 158, 11, 0.2)',
    borderDark: '#3F3F46',
    accentPrimary: '#F59E0B',
    accentHover: '#D97706',
    accentLight: 'rgba(245, 158, 11, 0.15)'
  },
  obsidian_emerald: {
    id: 'obsidian_emerald',
    name: 'Obsidian & Emerald',
    tagline: 'High-end matte obsidian with electric neon emerald',
    badgeBg: '#059669',
    previewColor: '#10B981',
    accentColor: '#10B981',
    secondaryAccent: '#059669',
    bgMain: '#050B08',
    bgGradient: 'radial-gradient(circle at 50% 0%, #064E3B 0%, #031D14 60%, #020F0A 100%)',
    surfaceCard: '#0A2016',
    surfacePill: '#0F2E20',
    textPrimary: '#ECFDF5',
    textSecondary: '#A7F3D0',
    textMuted: '#6EE7B7',
    borderSubtle: 'rgba(16, 185, 129, 0.25)',
    borderDark: '#065F46',
    accentPrimary: '#10B981',
    accentHover: '#059669',
    accentLight: 'rgba(16, 185, 129, 0.15)'
  },
  classic_heritage: {
    id: 'classic_heritage',
    name: 'Classic Heritage',
    tagline: 'Iconic barber pole red, vintage navy & crisp white',
    badgeBg: '#DC2626',
    previewColor: '#EF4444',
    accentColor: '#EF4444',
    secondaryAccent: '#2563EB',
    bgMain: '#0A0F1D',
    bgGradient: 'radial-gradient(circle at 50% 0%, #1E293B 0%, #0F172A 70%, #090D16 100%)',
    surfaceCard: '#1E293B',
    surfacePill: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    borderSubtle: 'rgba(239, 68, 68, 0.25)',
    borderDark: '#475569',
    accentPrimary: '#EF4444',
    accentHover: '#DC2626',
    accentLight: 'rgba(239, 68, 68, 0.15)'
  },
  cyber_slate: {
    id: 'cyber_slate',
    name: 'Cyber Slate',
    tagline: 'Futuristic slate with electric cyan and purple accents',
    badgeBg: '#0891B2',
    previewColor: '#06B6D4',
    accentColor: '#06B6D4',
    secondaryAccent: '#8B5CF6',
    bgMain: '#030712',
    bgGradient: 'radial-gradient(circle at 50% 0%, #1E1B4B 0%, #0F172A 60%, #030712 100%)',
    surfaceCard: '#0F172A',
    surfacePill: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    borderSubtle: 'rgba(6, 182, 212, 0.25)',
    borderDark: '#334155',
    accentPrimary: '#06B6D4',
    accentHover: '#0891B2',
    accentLight: 'rgba(6, 182, 212, 0.15)'
  },
  rose_gold: {
    id: 'rose_gold',
    name: 'Rose Gold Luxe',
    tagline: 'Warm bronze-black with refined champagne rose gold',
    badgeBg: '#E11D48',
    previewColor: '#FB7185',
    accentColor: '#FB7185',
    secondaryAccent: '#F43F5E',
    bgMain: '#181114',
    bgGradient: 'radial-gradient(circle at 50% 0%, #3B1822 0%, #181114 70%, #0D080A 100%)',
    surfaceCard: '#27171D',
    surfacePill: '#3D202B',
    textPrimary: '#FFF1F2',
    textSecondary: '#FECDD3',
    textMuted: '#FDA4AF',
    borderSubtle: 'rgba(251, 113, 133, 0.25)',
    borderDark: '#4C1D2D',
    accentPrimary: '#FB7185',
    accentHover: '#F43F5E',
    accentLight: 'rgba(251, 113, 133, 0.15)'
  },
  clean_studio: {
    id: 'clean_studio',
    name: 'Clean Studio',
    tagline: 'Ultra-modern studio monochrome with crisp light aesthetics',
    badgeBg: '#18181B',
    previewColor: '#27272A',
    accentColor: '#18181B',
    secondaryAccent: '#52525B',
    bgMain: '#F4F4F6',
    bgGradient: 'radial-gradient(circle at 50% 0%, #FFFFFF 0%, #F5F5F7 60%, #EAEAEF 100%)',
    surfaceCard: '#FFFFFF',
    surfacePill: '#F4F4F5',
    textPrimary: '#09090B',
    textSecondary: '#52525B',
    textMuted: '#A1A1AA',
    borderSubtle: 'rgba(0, 0, 0, 0.08)',
    borderDark: '#E4E4E7',
    accentPrimary: '#09090B',
    accentHover: '#27272A',
    accentLight: '#F4F4F5'
  }
};

export function applyTheme(themeId: ThemeId = 'midnight_gold') {
  const theme = THEME_PRESETS[themeId] || THEME_PRESETS.midnight_gold;
  const root = document.documentElement;

  root.style.setProperty('--bg-main', theme.bgMain);
  root.style.setProperty('--bg-gradient', theme.bgGradient);
  root.style.setProperty('--surface-card', theme.surfaceCard);
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

  // Set meta theme-color for iOS/Android status bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.bgMain);
  }
}
