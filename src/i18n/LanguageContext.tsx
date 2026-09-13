import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_VI_DICTIONARY, ALL_DICTIONARY_KEYS, TranslationItem } from './translations';
import { safeStorage } from '../utils/safeStorage';

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
  syncFromCloud: (cloudDict?: Record<string, string> | Record<string, Record<string, string>>) => void;
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
      const saved = safeStorage.getItem(STORAGE_KEYS.CUSTOM_DICT);
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

  const notifyChange = useCallback((updated: Record<string, string>) => {
    safeStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quanlyquy_custom_dict_changed', { detail: updated }));
    }
    if (onSaveToCloud) {
      onSaveToCloud({ customDictionary: updated });
    }
  }, [onSaveToCloud]);

  const syncFromCloud = useCallback((cloudDict?: Record<string, string> | Record<string, Record<string, string>>) => {
    if (!cloudDict || typeof cloudDict !== 'object') return;
    let normalized: Record<string, string> = {};
    if ('vi' in cloudDict && typeof (cloudDict as Record<string, Record<string, string>>).vi === 'object') {
      normalized = (cloudDict as Record<string, Record<string, string>>).vi;
    } else {
      normalized = cloudDict as Record<string, string>;
    }
    setActiveCustomTexts(normalized);
    safeStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(normalized));
  }, []);

  // Sync with Cloud updates
  useEffect(() => {
    if (cloudCustomDictionary) {
      syncFromCloud(cloudCustomDictionary);
    }
  }, [cloudCustomDictionary, syncFromCloud]);

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
      notifyChange(updated);
      return updated;
    });
  }, [notifyChange]);

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
      notifyChange(updated);
      return updated;
    });
  }, [notifyChange]);

  const resetCustomText = useCallback((key: string) => {
    setActiveCustomTexts(prev => {
      if (prev[key] === undefined) return prev;
      const updated = { ...prev };
      delete updated[key];
      notifyChange(updated);
      return updated;
    });
  }, [notifyChange]);

  const resetAllCustomTexts = useCallback(() => {
    setActiveCustomTexts({});
    notifyChange({});
  }, [notifyChange]);

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
        notifyChange(updated);
        return updated;
      });
      return true;
    } catch (e) {
      console.error('Error importing custom text JSON:', e);
      return false;
    }
  }, [notifyChange]);

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
    syncFromCloud,
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
    syncFromCloud,
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
