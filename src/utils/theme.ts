export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  gradient: string;
  sampleEmoji: string;
  chartAccent: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald',
    name: 'Ngọc Bích Tài Chính',
    tagline: 'Thịnh vượng, may mắn & dịu mắt tự nhiên',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    primaryText: '#065f46',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    sampleEmoji: '🌿',
    chartAccent: '#10b981',
  },
  {
    id: 'ocean',
    name: 'Đại Dương Đĩnh Đạc',
    tagline: 'Vững vàng, minh bạch & chuẩn mực ngân hàng',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryLight: '#f0f9ff',
    primaryBorder: '#bae6fd',
    primaryText: '#075985',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    sampleEmoji: '🌊',
    chartAccent: '#0284c7',
  },
  {
    id: 'indigo',
    name: 'Chàm Tinh Tế',
    tagline: 'Hiện đại, sang trọng & công nghệ cao',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#eef2ff',
    primaryBorder: '#c7d2fe',
    primaryText: '#3730a3',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    sampleEmoji: '💎',
    chartAccent: '#6366f1',
  },
  {
    id: 'amber',
    name: 'Hổ Phách Trầm Ấm',
    tagline: 'Thân thiện, ấm cúng & gắn kết anh em',
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    primaryText: '#92400e',
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    sampleEmoji: '☀️',
    chartAccent: '#f59e0b',
  },
  {
    id: 'violet',
    name: 'Thạch Anh Quý Phái',
    tagline: 'Độc bản, nghệ thuật & sáng tạo',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ddd6fe',
    primaryText: '#5b21b6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    sampleEmoji: '🔮',
    chartAccent: '#8b5cf6',
  },
  {
    id: 'forest',
    name: 'Rừng Thông Trầm Tĩnh',
    tagline: 'Bền vững, sâu lắng & góc nhìn êm ả',
    primary: '#15803d',
    primaryHover: '#166534',
    primaryLight: '#f0fdf4',
    primaryBorder: '#bbf7d0',
    primaryText: '#14532d',
    gradient: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
    sampleEmoji: '🌲',
    chartAccent: '#16a34a',
  },
  {
    id: 'slate',
    name: 'Phiến Thạch Tối Giản',
    tagline: 'Đơn sắc tối giản, trung tính & đĩnh đạc',
    primary: '#334155',
    primaryHover: '#1e293b',
    primaryLight: '#f8fafc',
    primaryBorder: '#cbd5e1',
    primaryText: '#0f172a',
    gradient: 'linear-gradient(135deg, #334155 0%, #64748b 100%)',
    sampleEmoji: '⚡',
    chartAccent: '#475569',
  },
];

export type ThemeRadius = 'modern' | 'soft' | 'smooth' | 'sharp';
export type ThemeDensity = 'comfortable' | 'compact';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface RadiusOption {
  id: ThemeRadius;
  name: string;
  desc: string;
  cssRadius: string;
  btnRadius: string;
  pillRadius: string;
  badgeRadius: string;
}

export const RADIUS_OPTIONS: RadiusOption[] = [
  {
    id: 'modern',
    name: 'Hiện đại (16px)',
    desc: 'Cân đối, thẩm mỹ & phổ biến nhất',
    cssRadius: '16px',
    btnRadius: '12px',
    pillRadius: '9999px',
    badgeRadius: '8px',
  },
  {
    id: 'soft',
    name: 'Thanh lịch (10px)',
    desc: 'Bo nhẹ tinh tế, chuyên nghiệp văn phòng',
    cssRadius: '10px',
    btnRadius: '8px',
    pillRadius: '12px',
    badgeRadius: '6px',
  },
  {
    id: 'smooth',
    name: 'Tròn mượt (22px)',
    desc: 'Tròn mượt mà, thân thiện phong cách mobile',
    cssRadius: '22px',
    btnRadius: '16px',
    pillRadius: '9999px',
    badgeRadius: '10px',
  },
  {
    id: 'sharp',
    name: 'Sắc nét (6px)',
    desc: 'Vuông vắn sắc sảo, tối đa không gian hiển thị',
    cssRadius: '6px',
    btnRadius: '4px',
    pillRadius: '6px',
    badgeRadius: '4px',
  },
];

// Helper to generate dynamic shade variations for custom hex color
export function getCustomPreset(hexColor: string, isDark: boolean = false): ThemePreset {
  const cleanHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
  return {
    id: 'custom',
    name: 'Màu Tùy Chọn Riêng',
    tagline: 'Sắc tố riêng tùy biến theo phong cách của bạn',
    primary: cleanHex,
    primaryHover: adjustColorBrightness(cleanHex, -20),
    primaryLight: isDark ? hexToRgba(cleanHex, 0.18) : hexToRgba(cleanHex, 0.08),
    primaryBorder: isDark ? hexToRgba(cleanHex, 0.35) : hexToRgba(cleanHex, 0.3),
    primaryText: isDark ? adjustColorBrightness(cleanHex, 35) : cleanHex,
    gradient: `linear-gradient(135deg, ${cleanHex} 0%, ${adjustColorBrightness(cleanHex, 35)} 100%)`,
    sampleEmoji: '🎨',
    chartAccent: cleanHex,
  };
}

export function findThemePreset(presetId: string, customColor?: string, isDark: boolean = false): ThemePreset {
  let preset: ThemePreset;
  if (presetId === 'custom' && customColor) {
    preset = getCustomPreset(customColor, isDark);
  } else {
    const found = THEME_PRESETS.find(p => p.id === presetId);
    preset = found ? { ...found } : { ...THEME_PRESETS[0] };
  }

  if (isDark) {
    return {
      ...preset,
      primaryLight: hexToRgba(preset.primary, 0.18),
      primaryBorder: hexToRgba(preset.primary, 0.35),
      primaryText: adjustColorBrightness(preset.primary, 35),
    };
  }

  return preset;
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(5, 150, 105, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustColorBrightness(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applyThemeToDocument(
  preset: ThemePreset,
  mode: ThemeMode,
  radius: ThemeRadius,
  density: ThemeDensity
) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Dark Mode handling
  let isDark = false;
  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'system') {
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  // 2. CSS Custom Properties for Colors
  root.style.setProperty('--theme-primary', preset.primary);
  root.style.setProperty('--theme-primary-hover', preset.primaryHover);
  root.style.setProperty('--theme-primary-light', isDark ? hexToRgba(preset.primary, 0.15) : preset.primaryLight);
  root.style.setProperty('--theme-primary-border', isDark ? hexToRgba(preset.primary, 0.35) : preset.primaryBorder);
  root.style.setProperty('--theme-primary-text', isDark ? '#ffffff' : preset.primaryText);
  root.style.setProperty('--theme-gradient', preset.gradient);

  // 3. Corner Radius
  const radiusConfig = RADIUS_OPTIONS.find(r => r.id === radius) || RADIUS_OPTIONS[0];
  root.style.setProperty('--theme-radius-card', radiusConfig.cssRadius);
  root.style.setProperty('--theme-radius-btn', radiusConfig.btnRadius);
  root.style.setProperty('--theme-radius-pill', radiusConfig.pillRadius);
  root.style.setProperty('--theme-radius-badge', radiusConfig.badgeRadius);

  // 4. Density class
  if (density === 'compact') {
    root.classList.add('density-compact');
  } else {
    root.classList.remove('density-compact');
  }
}
