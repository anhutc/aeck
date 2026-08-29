import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_VI_DICTIONARY, ALL_DICTIONARY_KEYS, TranslationItem } from './translations';

const STORAGE_KEYS = {
  CUSTOM_DICT: 'quanlyquy_custom_dictionary_v2',
};

interface LanguageContextValue {
  t: (key: string, fallback?: string) => string;
  activeCustomTexts: Record<string, string>;
  updateCustomText: (key: string, value: string) => void;
  batchUpdateCustomTexts: (updates: Record<string, string>) => void;
  resetCustomText: (key: string) => void;
  resetAllCustomTexts: () => void;
  exportDictionary: () => string;
  importDictionary: (jsonContent: string) => boolean;
  allDictionaryKeys: TranslationItem[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  cloudCustomDictionary?: Record<string, string> | Record<string, Record<string, string>>;
  onSaveToCloud?: (payload: { customDictionary?: Record<string, string> }) => void;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  cloudCustomDictionary,
  onSaveToCloud,
}) => {
  // Custom Dictionary Overrides: { 'nav.overview': 'Sổ Tổng Quan', 'common.add': 'Thêm Mới' }
  const [activeCustomTexts, setActiveCustomTexts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_DICT);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      // Handle backwards compatibility if it was nested { vi: { ... } }
      if (parsed && parsed.vi && typeof parsed.vi === 'object') {
        return parsed.vi;
      }
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });

  // Sync with Cloud updates
  useEffect(() => {
    if (cloudCustomDictionary && typeof cloudCustomDictionary === 'object') {
      let normalized: Record<string, string> = {};
      if ('vi' in cloudCustomDictionary && typeof (cloudCustomDictionary as Record<string, Record<string, string>>).vi === 'object') {
        normalized = (cloudCustomDictionary as Record<string, Record<string, string>>).vi;
      } else {
        normalized = cloudCustomDictionary as Record<string, string>;
      }
      setActiveCustomTexts(normalized);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(normalized));
    }
  }, [cloudCustomDictionary]);

  // Core Translation Function t(key, fallback)
  const t = useCallback((key: string, fallback?: string): string => {
    // 1. Check custom user overrides first
    if (activeCustomTexts && activeCustomTexts[key] !== undefined && activeCustomTexts[key].trim() !== '') {
      return activeCustomTexts[key];
    }

    // 2. Check default Vietnamese dictionary
    if (DEFAULT_VI_DICTIONARY[key] !== undefined) {
      return DEFAULT_VI_DICTIONARY[key];
    }

    // 3. Return provided fallback or key
    return fallback !== undefined ? fallback : key;
  }, [activeCustomTexts]);

  const updateCustomText = useCallback((key: string, value: string) => {
    setActiveCustomTexts(prev => {
      const updated = { ...prev };
      if (value.trim() === '') {
        delete updated[key];
      } else {
        updated[key] = value;
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(updated));
      if (onSaveToCloud) {
        onSaveToCloud({ customDictionary: updated });
      }
      return updated;
    });
  }, [onSaveToCloud]);

  const batchUpdateCustomTexts = useCallback((updates: Record<string, string>) => {
    setActiveCustomTexts(prev => {
      const updated = { ...prev };
      Object.entries(updates).forEach(([k, v]) => {
        if (v.trim() === '') {
          delete updated[k];
        } else {
          updated[k] = v;
        }
      });
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(updated));
      if (onSaveToCloud) {
        onSaveToCloud({ customDictionary: updated });
      }
      return updated;
    });
  }, [onSaveToCloud]);

  const resetCustomText = useCallback((key: string) => {
    setActiveCustomTexts(prev => {
      if (prev[key] === undefined) return prev;
      const updated = { ...prev };
      delete updated[key];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(updated));
      if (onSaveToCloud) {
        onSaveToCloud({ customDictionary: updated });
      }
      return updated;
    });
  }, [onSaveToCloud]);

  const resetAllCustomTexts = useCallback(() => {
    setActiveCustomTexts({});
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify({}));
    if (onSaveToCloud) {
      onSaveToCloud({ customDictionary: {} });
    }
  }, [onSaveToCloud]);

  const exportDictionary = useCallback((): string => {
    const exportData = {
      app: 'AE Cây Khế - Quản Lý Quỹ',
      exportedAt: new Date().toISOString(),
      overrides: activeCustomTexts,
    };
    return JSON.stringify(exportData, null, 2);
  }, [activeCustomTexts]);

  const importDictionary = useCallback((jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      let overrides: Record<string, string> = {};
      if (parsed.overrides && typeof parsed.overrides === 'object') {
        overrides = parsed.overrides;
      } else if (parsed.vi && typeof parsed.vi === 'object') {
        overrides = parsed.vi;
      } else if (typeof parsed === 'object' && parsed !== null) {
        overrides = parsed;
      }

      setActiveCustomTexts(prev => {
        const updated = {
          ...prev,
          ...overrides,
        };
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(updated));
        if (onSaveToCloud) {
          onSaveToCloud({ customDictionary: updated });
        }
        return updated;
      });
      return true;
    } catch (e) {
      console.error('Error importing custom text JSON:', e);
      return false;
    }
  }, [onSaveToCloud]);

  // Dynamically merge standard dictionary keys with any custom user-added keys
  const mergedDictionaryKeys = useMemo<TranslationItem[]>(() => {
    const existingKeySet = new Set(ALL_DICTIONARY_KEYS.map(k => k.key));
    const customItems: TranslationItem[] = [];

    // Inspect all keys in activeCustomTexts
    Object.entries(activeCustomTexts).forEach(([key, customVal]) => {
      if (!existingKeySet.has(key)) {
        customItems.push({
          key,
          category: 'custom',
          categoryName: 'Văn Bản Tùy Biến Tự Do',
          description: `Văn bản tùy biến: "${key}"`,
          defaultValue: String(customVal || ''),
        });
      }
    });

    return [...customItems, ...ALL_DICTIONARY_KEYS];
  }, [activeCustomTexts]);

  const value = useMemo<LanguageContextValue>(() => ({
    t,
    activeCustomTexts,
    updateCustomText,
    batchUpdateCustomTexts,
    resetCustomText,
    resetAllCustomTexts,
    exportDictionary,
    importDictionary,
    allDictionaryKeys: mergedDictionaryKeys,
  }), [
    t,
    activeCustomTexts,
    updateCustomText,
    batchUpdateCustomTexts,
    resetCustomText,
    resetAllCustomTexts,
    exportDictionary,
    importDictionary,
    mergedDictionaryKeys,
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
