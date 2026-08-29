import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  Edit3, 
  Save, 
  FileJson,
  Sliders,
  LayoutDashboard,
  ArrowRightLeft,
  Target,
  Users,
  BarChart3,
  QrCode,
  Menu,
  Bell,
  Lock,
  RefreshCw,
  Settings,
  Tag,
  Share2,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { DEFAULT_VI_DICTIONARY } from '../../i18n/translations';
import { useFeedback } from '../../context/FeedbackContext';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Globe className="w-3.5 h-3.5" />,
  funds: <Wallet className="w-3.5 h-3.5" />,
  nav: <Menu className="w-3.5 h-3.5" />,
  portal: <Globe className="w-3.5 h-3.5" />,
  overview: <LayoutDashboard className="w-3.5 h-3.5" />,
  transactions: <ArrowRightLeft className="w-3.5 h-3.5" />,
  campaigns: <Target className="w-3.5 h-3.5" />,
  members: <Users className="w-3.5 h-3.5" />,
  reports: <BarChart3 className="w-3.5 h-3.5" />,
  vietqr: <QrCode className="w-3.5 h-3.5" />,
  settings: <Settings className="w-3.5 h-3.5" />,
  notice: <Bell className="w-3.5 h-3.5" />,
  reset: <RefreshCw className="w-3.5 h-3.5" />,
  text_editor: <Edit3 className="w-3.5 h-3.5" />,
  auth: <Lock className="w-3.5 h-3.5" />,
  share: <Share2 className="w-3.5 h-3.5" />,
  dialog: <AlertTriangle className="w-3.5 h-3.5" />,
  common: <Sliders className="w-3.5 h-3.5" />,
};

export const LanguageAndTextEditor: React.FC = () => {
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

  const { showConfirm, showAlert, showToast } = useFeedback();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'customized' | 'default'>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Categories list with count
  const categories = useMemo(() => {
    const catMap = new Map<string, { id: string; name: string; count: number }>();
    catMap.set('all', { id: 'all', name: 'Tất Cả Chuyên Mục', count: allDictionaryKeys.length });

    allDictionaryKeys.forEach(k => {
      const current = catMap.get(k.category) || { id: k.category, name: k.categoryName, count: 0 };
      current.count += 1;
      catMap.set(k.category, current);
    });

    return Array.from(catMap.values());
  }, [allDictionaryKeys]);

  // Filtered keys
  const filteredItems = useMemo(() => {
    return allDictionaryKeys.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      const activeVal = activeCustomTexts[item.key] !== undefined
        ? activeCustomTexts[item.key]
        : (DEFAULT_VI_DICTIONARY[item.key] || item.defaultValue);

      const isCustomized = activeCustomTexts[item.key] !== undefined && activeCustomTexts[item.key].trim() !== '';

      // Status filter
      if (filterMode === 'customized' && !isCustomized) return false;
      if (filterMode === 'default' && isCustomized) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchKey = item.key.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchDefault = item.defaultValue.toLowerCase().includes(q);
        const matchActive = activeVal.toLowerCase().includes(q);
        return matchKey || matchDesc || matchDefault || matchActive;
      }

      return true;
    });
  }, [allDictionaryKeys, selectedCategory, filterMode, searchQuery, activeCustomTexts]);

  const customizedCount = Object.keys(activeCustomTexts).length;

  const handleStartEdit = (key: string, currentVal: string) => {
    setEditingKey(key);
    setTempValue(currentVal);
  };

  const handleSaveEdit = (key: string) => {
    updateCustomText(key, tempValue);
    setEditingKey(null);
    showToast(`Đã lưu thay đổi cho "${key}"`, 'success');
  };

  const handleResetItem = (key: string) => {
    resetCustomText(key);
    showToast(`Đã khôi phục văn bản gốc cho "${key}"`, 'info');
  };

  const handleExport = () => {
    const jsonStr = exportDictionary();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuy_bien_tu_ngu_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp sao lưu từ ngữ (JSON)', 'success');
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      showAlert({
        title: 'Lỗi Nhập Dữ Liệu',
        message: 'Vui lòng dán nội dung JSON hợp lệ.',
        type: 'error',
      });
      return;
    }

    const success = importDictionary(importJsonText);
    if (success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      showToast('Đã nhập và áp dụng từ điển tùy chỉnh thành công!', 'success');
    } else {
      showAlert({
        title: 'Lỗi Định Dạng JSON',
        message: 'Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại cấu trúc dạng { "key": "value" }.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-xs">
                <Globe className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Từ Điển Giao Diện Toàn Diện
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {t('text_editor.banner_title', 'Tùy Chỉnh Toàn Bộ Câu Chữ & Thuật Ngữ Trên Toàn Bộ Giao Diện')}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 max-w-3xl leading-relaxed">
              {t('text_editor.banner_desc', 'Tất cả câu chữ (tiêu đề, nút bấm, bảng số liệu, thông báo popup, mã QR, mẫu in...) đã được nạp sẵn 100%. Bạn chỉ cần bấm nút [Sửa chữ] tại bất kỳ mục nào hoặc gõ từ vào ô tìm kiếm để đổi ngay!')}
            </p>
          </div>
        </div>
      </div>

      {/* Control Actions & Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('text_editor.search_placeholder', 'Gõ từ tiếng Việt, tên nút bấm hoặc nội dung cần sửa (VD: Tổng số dư, Quỹ Hoạt Động, Nộp tiền, VietQR)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕ {t('common.clear_filter', 'Xóa')}
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải tệp từ điển JSON về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('text_editor.export_btn', 'Xuất JSON')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Nhập tệp từ điển JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t('text_editor.import_btn', 'Nhập JSON')}</span>
            </button>

            {customizedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  showConfirm({
                    title: 'Khôi Phục Mặc Định Gốc',
                    message: `Bạn có chắc chắn muốn khôi phục toàn bộ ${customizedCount} câu chữ đã tùy chỉnh về mặc định ban đầu?`,
                    type: 'warning',
                    confirmText: 'Khôi Phục Tất Cả',
                    cancelText: 'Giữ Lại',
                    onConfirm: () => {
                      resetAllCustomTexts();
                      showToast('Đã khôi phục toàn bộ văn bản về mặc định!', 'info');
                    },
                  });
                }}
                className="px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('text_editor.reset_all_btn', 'Khôi phục gốc')} ({customizedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills & Filter Mode */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('text_editor.category_label', 'Chọn chuyên mục để xem & sửa:')}
            </span>

            {/* Quick status filters */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('text_editor.filter_all', 'Tất cả')} ({allDictionaryKeys.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('customized')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'customized'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('text_editor.filter_customized', 'Đã sửa')} ({customizedCount})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const icon = CATEGORY_ICONS[cat.id] || <Tag className="w-3.5 h-3.5" />;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dictionary Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <Globe className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {t('text_editor.empty_title', 'Không tìm thấy văn bản nào khớp với từ khóa')}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {t('text_editor.empty_hint', 'Thử tìm với từ khóa khác hoặc xóa ô tìm kiếm')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((item) => {
              const isCustomized = activeCustomTexts[item.key] !== undefined && activeCustomTexts[item.key].trim() !== '';
              const defaultText = DEFAULT_VI_DICTIONARY[item.key] || item.defaultValue;
              const currentActiveValue = isCustomized ? activeCustomTexts[item.key] : defaultText;
              const isCurrentlyEditing = editingKey === item.key;

              return (
                <div
                  key={item.key}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                    isCustomized
                      ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Key details & Default text */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1">
                          {CATEGORY_ICONS[item.category] || <Tag className="w-3 h-3" />}
                          {item.categoryName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-mono">
                          {item.key}
                        </span>
                        {isCustomized && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> {t('text_editor.badge_customized', 'Đã tùy biến')}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {item.description}
                      </div>

                      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <span>{t('text_editor.orig_label', 'Văn bản gốc:')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {defaultText}
                        </span>
                      </div>
                    </div>

                    {/* Right: Active Value / Inline Edit input */}
                    <div className="flex-1 max-w-xl">
                      {isCurrentlyEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            placeholder={defaultText}
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-hidden"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.key);
                              if (e.key === 'Escape') setEditingKey(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.key)}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                          >
                            <Save className="w-4 h-4" />
                            <span>{t('text_editor.btn_save', 'Lưu')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0 cursor-pointer"
                          >
                            {t('text_editor.btn_cancel', 'Hủy')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                              {t('text_editor.display_label', 'Văn bản hiển thị trên ứng dụng:')}
                            </span>
                            <span className={`text-xs sm:text-sm font-bold truncate block ${isCustomized ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                              {currentActiveValue}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item.key, currentActiveValue)}
                              className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t('text_editor.btn_edit', 'Sửa chữ')}</span>
                            </button>

                            {isCustomized && (
                              <button
                                type="button"
                                onClick={() => handleResetItem(item.key)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                title={t('text_editor.btn_reset_item', "Khôi phục về văn bản gốc mặc định")}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Import JSON */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('text_editor.import_title', 'Nhập Từ Điển Tùy Chỉnh (JSON)')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {t('text_editor.import_desc', 'Dán nội dung tệp JSON từ điển đã xuất trước đó để khôi phục hoặc sao chép sang thiết bị khác:')}
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`{\n  "funds.default_fund_name": "Quỹ Lớp 12A",\n  "overview.total_balance": "Tổng Tiền Quỹ",\n  "transactions.btn_add_income": "+ Nộp Tiền Quỹ"\n}`}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
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
