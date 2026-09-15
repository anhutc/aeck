import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_VI_DICTIONARY, ALL_DICTIONARY_KEYS, TranslationItem } from './translations';
import { safeStorage } from '../utils/safeStorage';
import { saveCustomDictionaryToCloud } from '../lib/cloudStore';

export const STORAGE_KEYS = {
  CUSTOM_DICT: 'quanlyquy_custom_dictionary_v2',
};

// Recursively flattens any nested JSON structures into standard dot-notation keys
export function flattenDictionary(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  if (!obj || typeof obj !== 'object') return result;

  // Handle { vi: { ... } } or { overrides: { ... } } or { dictionary: { ... } } root wrapping
  if (!prefix && obj.dictionary && typeof obj.dictionary === 'object') {
    return flattenDictionary(obj.dictionary);
  }
  if (!prefix && obj.vi && typeof obj.vi === 'object') {
    return flattenDictionary(obj.vi);
  }
  if (!prefix && obj.overrides && typeof obj.overrides === 'object') {
    return flattenDictionary(obj.overrides);
  }

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    // Skip metadata fields at the root level if present
    if (!prefix && (
      key === 'app' ||
      key === 'version' ||
      key === 'exportedAt' ||
      key === 'description' ||
      key === 'note' ||
      key === 'totalKeys' ||
      key === 'instructions'
    )) {
      continue;
    }
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenDictionary(value, fullKey));
    } else if (typeof value === 'string' && value.trim() !== '') {
      result[fullKey] = value;
    }
  }
  return result;
}

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
  syncFromCloud: (cloudDict?: Record<string, any>) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  cloudCustomDictionary?: Record<string, any>;
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
      return flattenDictionary(parsed);
    } catch {
      return {};
    }
  });

  const notifyChange = useCallback((updated: Record<string, string>) => {
    safeStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quanlyquy_custom_dict_changed', { detail: updated }));
    }
    // Direct atomic Cloud Firestore update prevents race conditions with parent state
    saveCustomDictionaryToCloud(updated).catch((err) => {
      console.warn('Direct save custom dictionary to cloud failed (will retry on next sync):', err);
    });
    if (onSaveToCloud) {
      onSaveToCloud({ customDictionary: updated });
    }
  }, [onSaveToCloud]);

  const syncFromCloud = useCallback((cloudDict?: Record<string, any>) => {
    if (!cloudDict || typeof cloudDict !== 'object') return;
    const normalized = flattenDictionary(cloudDict);
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
    // Export full dictionary: defaults merged with any user overrides
    const fullDictionary: Record<string, string> = {};

    // 1. Fill with all master keys from ALL_DICTIONARY_KEYS / DEFAULT_VI_DICTIONARY
    ALL_DICTIONARY_KEYS.forEach(item => {
      const customVal = activeCustomTexts[item.key];
      fullDictionary[item.key] = (customVal !== undefined && customVal.trim() !== '')
        ? customVal
        : (item.defaultValue || DEFAULT_VI_DICTIONARY[item.key] || '');
    });

    // 2. Also append any extra custom keys in activeCustomTexts that may not be in ALL_DICTIONARY_KEYS
    Object.entries(activeCustomTexts).forEach(([key, val]) => {
      if (val !== undefined && val.trim() !== '' && !(key in fullDictionary)) {
        fullDictionary[key] = val;
      }
    });

    const exportData = {
      app: 'AE Cây Khế - Quản Lý Quỹ',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      description: 'Tệp từ điển toàn bộ câu chữ của ứng dụng (bao gồm cả mặc định và tùy biến). Bạn có thể chỉnh sửa giá trị câu chữ bên ngoài bằng Notepad, VS Code... rồi dùng chức năng "Nhập JSON" để cập nhật lại hệ thống.',
      totalKeys: Object.keys(fullDictionary).length,
      dictionary: fullDictionary,
    };
    return JSON.stringify(exportData, null, 2);
  }, [activeCustomTexts]);

  const importDictionary = useCallback((jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      const importedMap = flattenDictionary(parsed);

      // Determine true overrides: compare each value against DEFAULT_VI_DICTIONARY
      const newOverrides: Record<string, string> = {};

      Object.entries(importedMap).forEach(([key, value]) => {
        if (!key || typeof value !== 'string') return;
        const trimmedVal = value.trim();
        const defaultVal = (DEFAULT_VI_DICTIONARY[key] || '').trim();

        if (trimmedVal !== '') {
          // If key is known in DEFAULT_VI_DICTIONARY, only set as override if different from default
          if (key in DEFAULT_VI_DICTIONARY) {
            if (trimmedVal !== defaultVal) {
              newOverrides[key] = value;
            }
          } else {
            // New custom user key
            newOverrides[key] = value;
          }
        }
      });

      setActiveCustomTexts(newOverrides);
      notifyChange(newOverrides);
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
