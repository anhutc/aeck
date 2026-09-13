import React, { useState, useMemo, useRef } from 'react';
import { 
  Languages, 
  Search, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  Edit3, 
  X, 
  Copy, 
  Sparkles,
  Filter,
  Plus,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { TranslationItem } from '../../i18n/translations';

interface TextCustomizerSectionProps {
  onNotifyDirty?: () => void;
}

export const TextCustomizerSection: React.FC<TextCustomizerSectionProps> = ({
  onNotifyDirty,
}) => {
  const { 
    t, 
    activeCustomTexts, 
    updateCustomText, 
    resetCustomText, 
    resetAllCustomTexts,
    exportDictionary,
    importDictionary,
    allDictionaryKeys,
  } = useTranslation();

  const { activePreset } = useTheme();
  const { showToast, showConfirm } = useFeedback();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'customized' | 'default'>('all');
  
  // Editing State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Add custom key modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Import JSON Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Calculate unique categories
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    
    allDictionaryKeys.forEach(item => {
      const catId = item.category || 'common';
      const catName = item.categoryName || 'Chung';
      const existing = map.get(catId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(catId, { id: catId, name: catName, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allDictionaryKeys]);

  // Filtered List
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return allDictionaryKeys.filter(item => {
      const isCustom = Boolean(activeCustomTexts[item.key] !== undefined && activeCustomTexts[item.key].trim() !== '');
      const currentText = isCustom ? activeCustomTexts[item.key] : item.defaultValue;

      // Status filter
      if (statusFilter === 'customized' && !isCustom) return false;
      if (statusFilter === 'default' && isCustom) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Keyword search
      if (!q) return true;

      return (
        item.key.toLowerCase().includes(q) ||
        item.defaultValue.toLowerCase().includes(q) ||
        currentText.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q))
      );
    });
  }, [allDictionaryKeys, searchTerm, selectedCategory, statusFilter, activeCustomTexts]);

  // Paginated Items
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Stats
  const totalCount = allDictionaryKeys.length;
  const customizedCount = Object.keys(activeCustomTexts).length;

  const handleStartEdit = (item: TranslationItem) => {
    setEditingKey(item.key);
    setEditValue(activeCustomTexts[item.key] !== undefined ? activeCustomTexts[item.key] : item.defaultValue);
  };

  const handleSaveEdit = (key: string) => {
    updateCustomText(key, editValue);
    setEditingKey(null);
    onNotifyDirty?.();
    showToast(t('common.saved_success', 'Đã lưu thay đổi từ ngữ!'), 'success');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleResetSingle = (item: TranslationItem) => {
    resetCustomText(item.key);
    if (editingKey === item.key) {
      setEditingKey(null);
    }
    onNotifyDirty?.();
    showToast(`Đã khôi phục từ ngữ "${item.key}" về mặc định!`, 'info');
  };

  const handleResetAll = () => {
    showConfirm({
      title: t('text_editor.reset_all_btn', 'Khôi phục tất cả về gốc'),
      message: 'Toàn bộ từ ngữ, nhãn nút bấm và tiêu đề bạn đã tùy biến sẽ được đưa về văn bản gốc ban đầu của ứng dụng. Bạn có chắc chắn muốn khôi phục?',
      confirmText: 'Đồng Ý Khôi Phục',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        resetAllCustomTexts();
        setEditingKey(null);
        onNotifyDirty?.();
        showToast('Đã khôi phục toàn bộ từ ngữ về mặc định!', 'success');
      },
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleExportJson = () => {
    const jsonStr = exportDictionary();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quan_ly_quy_tu_dien_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp từ điển JSON thành công!', 'success');
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      showToast('Vui lòng dán nội dung JSON hợp lệ!', 'error');
      return;
    }
    const success = importDictionary(importJsonText);
    if (success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      onNotifyDirty?.();
      showToast('Đã nhập và áp dụng từ điển tùy chỉnh thành công!', 'success');
    } else {
      showToast('Tệp JSON không đúng định dạng!', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDictionary(content);
        if (success) {
          onNotifyDirty?.();
          showToast('Đã nhập và áp dụng tệp từ điển thành công!', 'success');
        } else {
          showToast('Tệp JSON không đúng định dạng từ điển!', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = newKey.trim();
    const trimmedVal = newValue.trim();

    if (!trimmedKey || !trimmedVal) {
      showToast('Vui lòng điền đầy đủ mã từ khóa và nội dung hiển thị!', 'error');
      return;
    }

    updateCustomText(trimmedKey, trimmedVal);
    setIsAddModalOpen(false);
    setNewKey('');
    setNewValue('');
    onNotifyDirty?.();
    showToast(`Đã thêm từ khóa mới "${trimmedKey}" thành công!`, 'success');
  };

  return (
    <div id="settings-text-editor" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{
              backgroundColor: activePreset.primary,
              boxShadow: `0 2px 10px ${activePreset.primary}35`,
            }}
          >
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('text_editor.banner_title', 'Tùy Chỉnh Toàn Bộ Câu Chữ & Thuật Ngữ Giao Diện')}</span>
              {customizedCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {customizedCount} đã sửa
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {t('text_editor.banner_desc', 'Dễ dàng sửa trực tiếp mọi câu chữ, tiêu đề, nhãn nút bấm, thông báo và thuật ngữ trên toàn bộ ứng dụng theo ý bạn.')}
            </p>
          </div>
        </div>

        {/* Global Actions Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            title="Tải tệp JSON từ điển về máy"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('text_editor.export_btn', 'Xuất JSON')}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Tải tệp JSON từ máy tính lên"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t('text_editor.import_btn', 'Nhập JSON')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            title="Thêm từ khóa tùy chỉnh mới"
            style={{
              backgroundColor: `${activePreset.primary}12`,
              color: activePreset.primary,
              borderColor: `${activePreset.primary}30`,
            }}
            className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-85 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ khóa</span>
          </button>

          {customizedCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              title="Khôi phục toàn bộ từ ngữ về ban đầu"
              className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('text_editor.reset_all_btn', 'Khôi phục gốc')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tổng từ ngữ hệ thống</div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">{totalCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40">
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Đã tùy biến</div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">{customizedCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Giữ nguyên mặc định</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{totalCount - customizedCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-900/40">
          <div className="text-[11px] font-medium text-violet-700 dark:text-violet-300">Kết quả đang lọc</div>
          <div className="text-lg font-black text-violet-600 dark:text-violet-400 mt-0.5 font-mono">{filteredItems.length}</div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('text_editor.search_placeholder', 'Gõ từ tiếng Việt, tên nút bấm hoặc mã từ khóa cần sửa (VD: Tổng số dư, Nộp tiền, VietQR)...')}
              className="w-full pl-9.5 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({allDictionaryKeys.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('customized');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'customized'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Đã sửa ({customizedCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('default');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === 'default'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mặc định ({totalCount - customizedCount})
            </button>
          </div>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t('text_editor.cat_all', 'Tất Cả Chuyên Mục')} ({totalCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Item List Container */}
      <div className="space-y-2.5">
        {pagedItems.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('text_editor.empty_title', 'Không tìm thấy văn bản nào khớp với từ khóa')}
            </h4>
            <p className="text-xs text-slate-500">
              {t('text_editor.empty_hint', 'Thử tìm với từ khóa khác hoặc xóa ô tìm kiếm để xem tất cả.')}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
                className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Xóa tìm kiếm & Xem toàn bộ từ ngữ
              </button>
            )}
          </div>
        ) : (
          pagedItems.map((item) => {
            const isCustom = Boolean(activeCustomTexts[item.key] !== undefined && activeCustomTexts[item.key].trim() !== '');
            const currentDisplay = isCustom ? activeCustomTexts[item.key] : item.defaultValue;
            const isEditing = editingKey === item.key;

            return (
              <div
                key={item.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCustom
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                } hover:border-slate-300 dark:hover:border-slate-700`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Info & Key */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.categoryName || item.category}
                      </span>

                      {/* Key Name Capsule */}
                      <button
                        type="button"
                        onClick={() => handleCopyKey(item.key)}
                        title="Bấm để sao chép mã từ khóa"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <span>{item.key}</span>
                        {copiedKey === item.key ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </button>

                      {/* Customized Flag */}
                      {isCustom && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{t('text_editor.badge_customized', 'Đã tùy biến')}</span>
                        </span>
                      )}
                    </div>

                    {/* Original Default Hint */}
                    {isCustom && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{t('text_editor.orig_label', 'Văn bản gốc:')}</span>
                        <span className="italic line-through opacity-80">{item.defaultValue}</span>
                      </div>
                    )}

                    {/* Description if any */}
                    {item.description && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {item.description}
                      </div>
                    )}

                    {/* Current Value Display / Editor */}
                    {isEditing ? (
                      <div className="pt-2 space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t('text_editor.display_label', 'Văn bản hiển thị mới trên ứng dụng:')}
                        </label>
                        {item.defaultValue.length > 50 || editValue.length > 50 ? (
                          <textarea
                            rows={3}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full p-2.5 text-xs font-medium rounded-xl border border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden ring-2 ring-emerald-500/20"
                            placeholder="Nhập nội dung mới..."
                            autoFocus
                          />
                        ) : (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden ring-2 ring-emerald-500/20"
                            placeholder="Nhập nội dung mới..."
                            autoFocus
                          />
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.key)}
                            style={{ backgroundColor: activePreset.primary }}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-90 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('text_editor.btn_save', 'Lưu thay đổi')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            {t('text_editor.btn_cancel', 'Hủy')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditValue(item.defaultValue)}
                            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline ml-auto"
                          >
                            Điền lại văn bản gốc
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 flex items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                          {currentDisplay}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        style={{
                          backgroundColor: `${activePreset.primary}12`,
                          color: activePreset.primary,
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:opacity-85 transition-opacity cursor-pointer border border-transparent"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t('text_editor.btn_edit', 'Sửa chữ')}</span>
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleResetSingle(item)}
                          title={t('text_editor.btn_reset_item', 'Khôi phục về văn bản gốc mặc định')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filteredItems.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-semibold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredItems.length)}</span> trên <span className="font-semibold text-slate-900 dark:text-white">{filteredItems.length}</span> từ ngữ
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value={20}>20 dòng/trang</option>
              <option value={30}>30 dòng/trang</option>
              <option value={50}>50 dòng/trang</option>
              <option value={100}>100 dòng/trang</option>
              <option value={500}>500 dòng/trang</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Trước
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Custom Key */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Thêm Từ Khóa Tùy Biến Mới</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewKey} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã từ khóa (Key - VD: custom.welcome_note, app.header_slogan):
                </label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="VD: custom.my_button_label"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung hiển thị (Văn bản tiếng Việt):
                </label>
                <textarea
                  required
                  rows={3}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Nhập nội dung bạn muốn hiển thị..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: activePreset.primary }}
                  className="px-4 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90 cursor-pointer shadow-sm"
                >
                  Thêm Từ Khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import JSON */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>{t('text_editor.import_title', 'Nhập Từ Điển Tùy Chỉnh (JSON)')}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('text_editor.import_desc', 'Dán nội dung tệp JSON từ điển đã xuất trước đó để khôi phục hoặc sao chép sang thiết bị khác:')}
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={'{\n  "overrides": {\n    "nav.overview": "Sổ Tổng Quan",\n    "common.add": "Thêm Mới"\n  }\n}'}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                style={{ backgroundColor: activePreset.primary }}
                className="px-4 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90 cursor-pointer shadow-sm"
              >
                {t('text_editor.import_submit', 'Áp dụng từ điển')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
