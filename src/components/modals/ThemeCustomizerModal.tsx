import React, { useState } from 'react';
import {
  X,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { THEME_PRESETS, RADIUS_OPTIONS } from '../../utils/theme';
import { AppBranding } from '../../types';
import { useFeedback } from '../../context/FeedbackContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  branding?: AppBranding;
  onUpdateBranding?: (branding: AppBranding) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  branding,
  onUpdateBranding,
}) => {
  const {
    themeAccent,
    setThemeAccent,
    customColor,
    setCustomColor,
    themeMode,
    setThemeMode,
    setDefaultThemeMode,
    themeRadius,
    setThemeRadius,
    themeDensity,
    setThemeDensity,
    privacyMode,
    togglePrivacyMode,
    activePreset,
    resetToDefaultTheme,
  } = useTheme();

  const { showToast } = useFeedback();
  const [hexInput, setHexInput] = useState(customColor);
  const [isCloudSaving, setIsCloudSaving] = useState(false);

  if (!isOpen) return null;

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setCustomColor(val);
      setThemeAccent('custom');
    }
  };

  const handleSaveToGroupCloud = () => {
    if (!isAdmin || !onUpdateBranding || !branding) {
      showToast('Đã lưu tùy chọn hiển thị trên thiết bị của bạn!', 'success', 'Giao Diện Cá Nhân');
      onClose();
      return;
    }

    setIsCloudSaving(true);
    setDefaultThemeMode(themeMode);
    onUpdateBranding({
      ...branding,
      themeAccent,
      customColor: themeAccent === 'custom' ? customColor : undefined,
      themeMode,
      themeRadius,
      themeDensity,
    });

    setTimeout(() => {
      setIsCloudSaving(false);
      showToast('Đã đồng bộ màu sắc & giao diện chuẩn cho tất cả thành viên trong nhóm!', 'success', 'Đồng Bộ Giao Diện Nhóm');
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md text-lg"
                style={{ background: activePreset.gradient }}
              >
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Tùy Biến Màu Sắc & Thiết Kế
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Tối ưu góc nhìn
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cá nhân hóa bảng màu hài hòa, chế độ sáng/tối và trải nghiệm thị giác
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            
            {/* LIVE INTERACTIVE PREVIEW CARD */}
            <div className="rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Góc Nhìn Thực Tế (Live Preview)
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Chủ đề: <b className="text-slate-900 dark:text-white">{activePreset.name}</b>
                </span>
              </div>

              {/* Sample Mini Hero Card */}
              <div
                className="p-4 rounded-2xl text-white shadow-sm relative overflow-hidden transition-all duration-300"
                style={{ background: activePreset.gradient }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activePreset.sampleEmoji}</span>
                    <span className="text-xs font-bold tracking-wide opacity-90 uppercase">
                      {branding?.appTitle || 'AE Cây Khế'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                    Minh Bạch 100%
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] opacity-80 block">Tổng số dư quỹ</span>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                      {privacyMode ? '•••••••• ₫' : '45.850.000 ₫'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-xs hover:bg-white/95 transition-all cursor-pointer"
                  >
                    Đóng quỹ ngay
                  </button>
                </div>
              </div>

              {/* Sample Pills & Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  style={{ backgroundColor: activePreset.primary }}
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  Nút Hành Động Chính
                </button>
                <span
                  style={{
                    backgroundColor: activePreset.primaryLight,
                    color: activePreset.primaryText,
                    borderColor: activePreset.primaryBorder,
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-bold border transition-all"
                >
                  Thẻ Phân Loại Đẹp Mắt
                </span>
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
                >
                  {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{privacyMode ? 'Đang ẩn số tiền' : 'Hiện số tiền'}</span>
                </button>
              </div>
            </div>

            {/* 1. COLOR PRESETS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Chọn Bảng Màu Chủ Đạo (Palettes)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {THEME_PRESETS.length} màu chuẩn thị giác
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = themeAccent === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThemeAccent(preset.id)}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-2 shadow-sm ring-2'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                      }`}
                      style={{
                        borderColor: isSelected ? preset.primary : undefined,
                        boxShadow: isSelected ? `0 0 0 2px ${preset.primaryLight}` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 text-sm"
                          style={{ background: preset.gradient }}
                        >
                          {preset.sampleEmoji}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {preset.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                            {preset.tagline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                          style={{ backgroundColor: preset.primary }}
                        />
                        {isSelected && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: preset.primary }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM COLOR PICKER OPTION */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  themeAccent === 'custom'
                    ? 'border-2 bg-slate-50/80 dark:bg-slate-800/80 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                }`}
                style={{
                  borderColor: themeAccent === 'custom' ? customColor : undefined,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs text-sm shrink-0"
                      style={{ backgroundColor: customColor }}
                    >
                      🎨
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Màu Sắc Thương Hiệu Tự Chọn (Custom Hex)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nhập mã HEX tùy ý theo màu logo câu lạc bộ hoặc công ty
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setHexInput(e.target.value);
                        setThemeAccent('custom');
                      }}
                      className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={hexInput}
                      onChange={handleCustomHexChange}
                      placeholder="#059669"
                      className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => setThemeAccent('custom')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        themeAccent === 'custom'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {themeAccent === 'custom' ? 'Đang dùng' : 'Chọn'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. APPEARANCE MODE (LIGHT / DARK / SYSTEM) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                2. Chế Độ Hiển Thị Ánh Sáng (Mode)
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    themeMode === 'light'
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold">Giao diện Sáng</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Rõ ràng, tinh khôi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    themeMode === 'dark'
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-bold">Giao diện Tối</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Dịu mắt ban đêm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    themeMode === 'system'
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Laptop className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold">Theo Thiết Bị</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Tự động thích ứng</span>
                </button>
              </div>
            </div>

            {/* 3. CORNER RADIUS STYLE */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                3. Phong Cách Góc Bo Giao Diện (Corner Roundness)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {RADIUS_OPTIONS.map((opt) => {
                  const isSelected = themeRadius === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setThemeRadius(opt.id)}
                      style={isSelected ? {
                        borderColor: activePreset.primary,
                        backgroundColor: activePreset.primaryLight,
                        color: activePreset.primaryText,
                        boxShadow: `0 0 0 2px ${activePreset.primary}33`,
                      } : undefined}
                      className={`p-3 border text-center transition-all flex flex-col items-center justify-between gap-1.5 cursor-pointer ${
                        opt.id === 'modern' ? 'rounded-2xl' : opt.id === 'soft' ? 'rounded-xl' : opt.id === 'smooth' ? 'rounded-3xl' : 'rounded-md'
                      } ${
                        isSelected
                          ? 'shadow-xs font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div
                        style={isSelected ? { borderColor: activePreset.primary, color: activePreset.primary } : undefined}
                        className={`w-8 h-8 border-2 border-dashed flex items-center justify-center text-xs font-bold ${
                          opt.id === 'modern' ? 'rounded-xl' : opt.id === 'soft' ? 'rounded-lg' : opt.id === 'smooth' ? 'rounded-2xl' : 'rounded-xs'
                        } ${isSelected ? '' : 'border-slate-300 dark:border-slate-600 text-slate-400'}`}
                      >
                        {opt.cssRadius}
                      </div>
                      <span className="text-xs">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 leading-tight block">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. DENSITY & VIEWPORT OPTIMIZATION */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                4. Mật Độ Thông Tin & Trải Nghiệm Góc Nhìn (Display Density)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setThemeDensity('comfortable')}
                  style={themeDensity === 'comfortable' ? {
                    borderColor: activePreset.primary,
                    backgroundColor: activePreset.primaryLight,
                    color: activePreset.primaryText,
                    boxShadow: `0 0 0 2px ${activePreset.primary}33`,
                  } : undefined}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    themeDensity === 'comfortable'
                      ? 'shadow-xs font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Thoáng Đãng (Tiêu chuẩn)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">
                      Khoảng cách rộng rãi, trực quan, dễ đọc trên mọi thiết bị
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeDensity('compact')}
                  style={themeDensity === 'compact' ? {
                    borderColor: activePreset.primary,
                    backgroundColor: activePreset.primaryLight,
                    color: activePreset.primaryText,
                    boxShadow: `0 0 0 2px ${activePreset.primary}33`,
                  } : undefined}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    themeDensity === 'compact'
                      ? 'shadow-xs font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <Sliders className="w-4 h-4 rotate-90" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Tinh Gọn (Mật độ cao)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">
                      Thu nhỏ khoảng cách, hiển thị nhiều dữ liệu và dòng giao dịch cùng lúc
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 5. PRIVACY BALANCES MASKING */}
            <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  privacyMode ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Chế Độ Riêng Tư Số Tiền (Privacy Masking)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Ẩn toàn bộ số tiền trên màn hình (`•••••••• ₫`) khi mở app nơi công cộng
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={togglePrivacyMode}
                style={privacyMode ? { backgroundColor: activePreset.primary } : undefined}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  privacyMode ? '' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    privacyMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                resetToDefaultTheme();
                showToast('Đã khôi phục bảng màu & giao diện mặc định!', 'info');
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Đóng
              </button>

              {isAdmin && onUpdateBranding ? (
                <button
                  type="button"
                  onClick={handleSaveToGroupCloud}
                  disabled={isCloudSaving}
                  style={{ backgroundColor: activePreset.primary }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isCloudSaving ? 'Đang lưu...' : 'Lưu cho cả nhóm'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ backgroundColor: activePreset.primary }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Áp dụng ngay</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
