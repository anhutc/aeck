import React, { useState, useEffect } from 'react';
import { ScrollText, X, Save, Sparkles, AlertCircle, Calendar, Info, FileText } from 'lucide-react';
import { GroupNotice } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface NoticeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: GroupNotice;
  onSaveNotice: (notice: GroupNotice) => void;
}

export const NoticeEditModal: React.FC<NoticeEditModalProps> = ({
  isOpen,
  onClose,
  notice,
  onSaveNotice,
}) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(notice?.enabled ?? true);
  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [type, setType] = useState<'info' | 'warning' | 'success'>(notice?.type || 'info');
  const [updatedAt, setUpdatedAt] = useState(notice?.updatedAt || new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (notice) {
      setEnabled(notice.enabled ?? true);
      setTitle(notice.title || '');
      setContent(notice.content || '');
      setType(notice.type || 'info');
      setUpdatedAt(notice.updatedAt || new Date().toISOString().split('T')[0]);
    }
  }, [notice, isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (templateType: 'general' | 'fees' | 'events') => {
    if (templateType === 'general') {
      setTitle(t('notice.tmpl_general_title', 'Nội quy & Quy định hoạt động quỹ'));
      setContent(
        t('notice.tmpl_general_content', '1. Mục đích: Quỹ hoạt động nhằm phục vụ các hoạt động chung, ăn uống, liên hoan, hiếu hỉ, sinh nhật và sự kiện.\n' +
        '2. Minh bạch: Mọi khoản thu đóng góp và hóa đơn chi tiêu được ghi sổ công khai 100% trên hệ thống theo thời gian thực.\n' +
        '3. Quyền hạn: Toàn bộ thành viên có quyền tra cứu số dư và sao kê chi tiết bất kỳ lúc nào.')
      );
    } else if (templateType === 'fees') {
      setTitle(t('notice.tmpl_fees_title', 'Quy chế đóng quỹ & Định mức thu định kỳ'));
      setContent(
        t('notice.tmpl_fees_content', '1. Định mức đóng quỹ: 100.000đ/thành viên/tháng (thu vào tuần đầu tiên của tháng).\n' +
        '2. Hình thức nộp: Chuyển khoản qua mã VietQR tự động hoặc nộp tiền mặt cho Thủ quỹ.\n' +
        '3. Thành viên đi công tác/nghỉ dài hạn áp dụng đóng theo năm hoặc được miễn giảm theo quy chế.')
      );
    } else if (templateType === 'events') {
      setTitle(t('notice.tmpl_events_title', 'Quy định chi tiêu hiếu hỉ, sinh nhật & Teambuilding'));
      setContent(
        t('notice.tmpl_events_content', '1. Sinh nhật thành viên: Quà tặng và chúc mừng trị giá 200.000đ - 300.000đ.\n' +
        '2. Hiếu hỉ tứ thân phụ mẫu / kết hôn: Mức thăm hỏi 500.000đ/suất.\n' +
        '3. Các khoản chi trên 1.000.000đ cần được sự thống nhất của ban đại diện hoặc đa số thành viên.')
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotice({
      enabled,
      title: title.trim() || t('notice.tmpl_general_title', 'Nội quy & Quy định hoạt động quỹ'),
      content: content.trim(),
      type,
      updatedAt: updatedAt || new Date().toISOString().split('T')[0],
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('notice.edit_modal_title', 'Bảng Nội Quy & Quy Định Quỹ')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('notice.edit_modal_subtitle', 'Quy chế cố định được công khai cho tất cả thành viên')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Quick Template Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">{t('notice.quick_templates', 'Mẫu nội quy mẫu nhanh:')}</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('general')}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {t('notice.template_1_btn', 'Mẫu 1: Quy chế chung')}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('fees')}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {t('notice.template_2_btn', 'Mẫu 2: Quy định đóng nộp')}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('events')}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {t('notice.template_3_btn', 'Mẫu 3: Hiếu hỉ & Sự kiện')}
                </button>
              </div>
            </div>

            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  {t('notice.show_notice_label', 'Hiển thị bảng nội quy')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {t('notice.show_notice_desc', 'Hiển thị cố định ở đầu trang Tổng quan')}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Style & Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('notice.display_style_label', 'Kiểu dáng hiển thị')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('info')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'info'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('notice.style_info', 'Quy chế (Xanh)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('warning')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('notice.style_warning', 'Lưu ý (Vàng)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('success')}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('notice.style_success', 'Minh bạch (Lá)')}</span>
                </button>
              </div>
            </div>

            {/* Title & Effective Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('notice.title_label', 'Tiêu đề bảng nội quy')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('notice.title_placeholder', 'VD: Nội quy & Quy định quỹ hoạt động...')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('notice.effective_date_label', 'Ngày áp dụng')}</span>
                </label>
                <input
                  type="date"
                  required
                  value={updatedAt}
                  onChange={(e) => setUpdatedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('notice.content_label', 'Nội dung các điều khoản / Quy định hoạt động')}
              </label>
              <textarea
                rows={5}
                required
                placeholder={t('notice.content_placeholder', 'Nhập từng điều khoản quy định hoạt động, mức đóng, quyền lợi và nguyên tắc thu chi minh bạch...')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? t('notice.saved_sync_success', 'Đã lưu & đồng bộ!') : t('notice.save_notice_btn', 'Lưu Bảng Nội Quy')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
