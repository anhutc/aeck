import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemePreset,
  ThemeMode,
  ThemeRadius,
  ThemeDensity,
  THEME_PRESETS,
  findThemePreset,
  applyThemeToDocument,
} from '../utils/theme';
import { AppBranding } from '../types';

interface ThemeContextType {
  themeAccent: string;
  setThemeAccent: (presetId: string) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  themeRadius: ThemeRadius;
  setThemeRadius: (radius: ThemeRadius) => void;
  themeDensity: ThemeDensity;
  setThemeDensity: (density: ThemeDensity) => void;
  privacyMode: boolean;
  setPrivacyMode: (privacy: boolean) => void;
  togglePrivacyMode: () => void;
  maskAmount: (amountStr: string) => string;
  activePreset: ThemePreset;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (open: boolean) => void;
  resetToDefaultTheme: () => void;
  syncFromBranding: (branding?: AppBranding) => void;
}

const THEME_STORAGE_KEYS = {
  ACCENT: 'quanlyquy_theme_accent_v1',
  CUSTOM_COLOR: 'quanlyquy_theme_custom_color_v1',
  MODE: 'quanlyquy_theme_mode_v1',
  RADIUS: 'quanlyquy_theme_radius_v1',
  DENSITY: 'quanlyquy_theme_density_v1',
  PRIVACY: 'quanlyquy_theme_privacy_v1',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme Accent
  const [themeAccent, setThemeAccentState] = useState<string>(() => {
    return localStorage.getItem(THEME_STORAGE_KEYS.ACCENT) || 'emerald';
  });

  // Custom Color Hex
  const [customColor, setCustomColorState] = useState<string>(() => {
    return localStorage.getItem(THEME_STORAGE_KEYS.CUSTOM_COLOR) || '#059669';
  });

  // Color Mode: light | dark | system
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEYS.MODE) as ThemeMode;
    return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'light';
  });

  // Corner Radius: modern | soft | smooth | sharp
  const [themeRadius, setThemeRadiusState] = useState<ThemeRadius>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEYS.RADIUS) as ThemeRadius;
    return saved && ['modern', 'soft', 'smooth', 'sharp'].includes(saved) ? saved : 'modern';
  });

  // Density: comfortable | compact
  const [themeDensity, setThemeDensityState] = useState<ThemeDensity>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEYS.DENSITY) as ThemeDensity;
    return saved && ['comfortable', 'compact'].includes(saved) ? saved : 'comfortable';
  });

  // Privacy Masking Mode
  const [privacyMode, setPrivacyModeState] = useState<boolean>(() => {
    return localStorage.getItem(THEME_STORAGE_KEYS.PRIVACY) === 'true';
  });

  // Modal Open state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Track system preference for dark mode
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

  // Active Theme Preset derived with dark mode awareness
  const activePreset = useMemo(() => {
    return findThemePreset(themeAccent, customColor, isDarkMode);
  }, [themeAccent, customColor, isDarkMode]);

  // Apply theme to document whenever settings change
  useEffect(() => {
    applyThemeToDocument(activePreset, themeMode, themeRadius, themeDensity);
  }, [activePreset, themeMode, themeRadius, themeDensity]);

  // Setters with localStorage persistence
  const setThemeAccent = useCallback((presetId: string) => {
    setThemeAccentState(presetId);
    localStorage.setItem(THEME_STORAGE_KEYS.ACCENT, presetId);
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
    localStorage.setItem(THEME_STORAGE_KEYS.CUSTOM_COLOR, hex);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEYS.MODE, mode);
  }, []);

  const setThemeRadius = useCallback((radius: ThemeRadius) => {
    setThemeRadiusState(radius);
    localStorage.setItem(THEME_STORAGE_KEYS.RADIUS, radius);
  }, []);

  const setThemeDensity = useCallback((density: ThemeDensity) => {
    setThemeDensityState(density);
    localStorage.setItem(THEME_STORAGE_KEYS.DENSITY, density);
  }, []);

  const setPrivacyMode = useCallback((privacy: boolean) => {
    setPrivacyModeState(privacy);
    localStorage.setItem(THEME_STORAGE_KEYS.PRIVACY, privacy ? 'true' : 'false');
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyModeState(prev => {
      const next = !prev;
      localStorage.setItem(THEME_STORAGE_KEYS.PRIVACY, next ? 'true' : 'false');
      return next;
    });
  }, []);

  const maskAmount = useCallback((amountStr: string): string => {
    if (!privacyMode) return amountStr;
    return '•••••••• ₫';
  }, [privacyMode]);

  const resetToDefaultTheme = useCallback(() => {
    setThemeAccent('emerald');
    setCustomColor('#059669');
    setThemeMode('light');
    setThemeRadius('modern');
    setThemeDensity('comfortable');
    setPrivacyMode(false);
  }, [setThemeAccent, setCustomColor, setThemeMode, setThemeRadius, setThemeDensity, setPrivacyMode]);

  // Sync from branding if cloud state updates and user hasn't explicitly customized yet
  const syncFromBranding = useCallback((branding?: AppBranding) => {
    if (!branding) return;
    if (branding.themeAccent && branding.themeAccent !== themeAccent) {
      // Only sync if locally not set or if user wants cloud defaults
      setThemeAccentState(branding.themeAccent);
      localStorage.setItem(THEME_STORAGE_KEYS.ACCENT, branding.themeAccent);
    }
    if (branding.customColor) {
      setCustomColorState(branding.customColor);
      localStorage.setItem(THEME_STORAGE_KEYS.CUSTOM_COLOR, branding.customColor);
    }
    if (branding.themeMode) {
      setThemeModeState(branding.themeMode);
      localStorage.setItem(THEME_STORAGE_KEYS.MODE, branding.themeMode);
    }
    if (branding.themeRadius) {
      setThemeRadiusState(branding.themeRadius);
      localStorage.setItem(THEME_STORAGE_KEYS.RADIUS, branding.themeRadius);
    }
    if (branding.themeDensity) {
      setThemeDensityState(branding.themeDensity);
      localStorage.setItem(THEME_STORAGE_KEYS.DENSITY, branding.themeDensity);
    }
  }, [themeAccent]);

  const value = useMemo(() => ({
    themeAccent,
    setThemeAccent,
    customColor,
    setCustomColor,
    themeMode,
    setThemeMode,
    isDarkMode,
    themeRadius,
    setThemeRadius,
    themeDensity,
    setThemeDensity,
    privacyMode,
    setPrivacyMode,
    togglePrivacyMode,
    maskAmount,
    activePreset,
    isCustomizerOpen,
    setIsCustomizerOpen,
    resetToDefaultTheme,
    syncFromBranding,
  }), [
    themeAccent,
    setThemeAccent,
    customColor,
    setCustomColor,
    themeMode,
    setThemeMode,
    isDarkMode,
    themeRadius,
    setThemeRadius,
    themeDensity,
    setThemeDensity,
    privacyMode,
    setPrivacyMode,
    togglePrivacyMode,
    maskAmount,
    activePreset,
    isCustomizerOpen,
    resetToDefaultTheme,
    syncFromBranding,
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
