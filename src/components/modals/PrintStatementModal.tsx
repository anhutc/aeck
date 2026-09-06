import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, Edit3, Check } from 'lucide-react';
import { Category, Fund, Transaction, AppBranding } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  funds: Fund[];
  categories: Category[];
  activeFundId?: string;
  branding?: AppBranding;
  onUpdateBranding?: (branding: AppBranding) => void;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  funds,
  categories,
  activeFundId,
  branding,
  onUpdateBranding,
}) => {
  const { t } = useTranslation();
  const [isEditingTexts, setIsEditingTexts] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(branding?.statementHeaderTitle || 'BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ');
  const [subtitle, setSubtitle] = useState(branding?.statementSubtitle || 'Trích xuất tự động từ hệ thống quản lý thu chi minh bạch');
  const [sign1Title, setSign1Title] = useState(branding?.statementSignatory1Title || 'Người lập biểu');
  const [sign1Name, setSign1Name] = useState(branding?.statementSignatory1Name || 'Kế toán quỹ');
  const [sign2Title, setSign2Title] = useState(branding?.statementSignatory2Title || 'Thủ quỹ');
  const [sign2Name, setSign2Name] = useState(branding?.statementSignatory2Name || branding?.treasurerName || 'Trần Thị Mai');
  const [sign3Title, setSign3Title] = useState(branding?.statementSignatory3Title || 'Trưởng ban duyệt');
  const [sign3Name, setSign3Name] = useState(branding?.statementSignatory3Name || 'Đại diện ban quản lý');
  const [footerNote, setFooterNote] = useState(branding?.statementFooterNote || 'Báo cáo này được trích xuất tự động từ hệ thống quản lý thu chi minh bạch và có giá trị lưu hành nội bộ.');

  if (!isOpen) return null;

  const fund = funds.find(f => f.id === activeFundId) || funds[0] || { id: 'fund_general', name: t('funds.general_fund', 'Quỹ Chung'), balance: 0 };
  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const completedTx = transactions.filter(t => t.status === 'completed' && (!activeFundId || t.fundId === activeFundId));

  const totalIncome = completedTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = completedTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveTextChanges = () => {
    if (onUpdateBranding && branding) {
      onUpdateBranding({
        ...branding,
        statementHeaderTitle: headerTitle.trim() || 'BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ',
        statementSubtitle: subtitle.trim(),
        statementSignatory1Title: sign1Title.trim() || 'Người lập biểu',
        statementSignatory1Name: sign1Name.trim() || 'Kế toán quỹ',
        statementSignatory2Title: sign2Title.trim() || 'Thủ quỹ',
        statementSignatory2Name: sign2Name.trim() || branding.treasurerName || 'Thủ quỹ',
        statementSignatory3Title: sign3Title.trim() || 'Trưởng ban duyệt',
        statementSignatory3Name: sign3Name.trim() || 'Đại diện ban quản lý',
        statementFooterNote: footerNote.trim(),
      });
    }
    setIsEditingTexts(false);
  };

  return (
    <div
      id="print-modal-overlay"
      className="fixed inset-0 z-50 p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center print:p-0 print:bg-white print:static print:block"
    >
      <div 
        id="print-modal-card" 
        className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full print:rounded-none print:max-h-none print:overflow-visible"
      >
        {/* Modal Controls (Fixed header at top of modal, hidden when printing) */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              {t('print.preview_title', 'Bản xem trước sao kê quỹ')}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsEditingTexts(!isEditingTexts)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditingTexts 
                  ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-200' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingTexts ? t('print.editing_btn', 'Đang sửa chữ') : t('print.customize_btn', 'Tùy chỉnh chữ & chữ ký')}</span>
            </button>

            <button
              id="trigger-print-btn"
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print.print_pdf_btn', 'In báo cáo / Lưu PDF')}</span>
            </button>
            <button
              id="close-print-modal-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick In-Modal Editor Tray when isEditingTexts is true */}
        {isEditingTexts && (
          <div className="p-4 bg-purple-50/70 border-b border-purple-200 print:hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                {t('print.direct_edit_label', 'Chỉnh sửa văn bản tiêu đề, phụ đề, chữ ký và ghi chú chân trang trực tiếp:')}
              </span>
              <button
                type="button"
                onClick={handleSaveTextChanges}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('print.save_text_btn', 'Lưu văn bản')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t('print.header_title_label', 'Tiêu đề báo cáo')}</label>
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t('print.subtitle_label', 'Phụ đề đơn vị / Ghi chú')}</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-purple-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">{t('print.sign_pos_1', 'Vị trí 1 (Bên trái)')}</span>
                <input
                  type="text"
                  placeholder={t('print.sign_title_ph', 'Chức danh')}
                  value={sign1Title}
                  onChange={(e) => setSign1Title(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder={t('print.sign_name_ph', 'Họ tên')}
                  value={sign1Name}
                  onChange={(e) => setSign1Name(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                />
              </div>

              <div className="p-2 rounded-lg bg-white border border-purple-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">{t('print.sign_pos_2', 'Vị trí 2 (Ở giữa)')}</span>
                <input
                  type="text"
                  placeholder={t('print.sign_title_ph', 'Chức danh')}
                  value={sign2Title}
                  onChange={(e) => setSign2Title(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder={t('print.sign_name_ph', 'Họ tên')}
                  value={sign2Name}
                  onChange={(e) => setSign2Name(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                />
              </div>

              <div className="p-2 rounded-lg bg-white border border-purple-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">{t('print.sign_pos_3', 'Vị trí 3 (Bên phải)')}</span>
                <input
                  type="text"
                  placeholder={t('print.sign_title_ph', 'Chức danh')}
                  value={sign3Title}
                  onChange={(e) => setSign3Title(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder={t('print.sign_name_ph', 'Họ tên')}
                  value={sign3Name}
                  onChange={(e) => setSign3Name(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{t('print.footer_note_label', 'Ghi chú chân trang in ấn')}</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Printable Document Area */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto flex-1 bg-white text-slate-900 print:p-6 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {headerTitle}
              </h1>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {subtitle}
              </p>
              <p className="text-sm text-slate-600 font-medium mt-1">
                <span className="font-bold text-slate-900"></span> ({t('print.current_balance_label', 'Số dư hiện tại:')} {formatVND(fund.balance)})
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p>{t('print.created_date_label', 'Ngày in:')} {new Date().toLocaleDateString('vi-VN')}</p>
              <p>{t('print.doc_code_label', 'Mã tài liệu:')} SKQ-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}</p>
            </div>
          </div>

          {/* Financial Summary KPI Box */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-medium">{t('print.total_income_label', 'Tổng thu ghi nhận')}</p>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">+{formatVND(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{t('print.total_expense_label', 'Tổng chi tiêu')}</p>
              <p className="text-lg font-bold text-rose-600 mt-0.5">-{formatVND(totalExpense)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{t('print.net_cashflow_label', 'Dòng tiền ròng')}</p>
              <p className={`text-lg font-bold mt-0.5 ${netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {netBalance >= 0 ? '+' : ''}{formatVND(netBalance)}
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 uppercase font-semibold">
                  <th className="py-2.5 px-3">{t('print.col_no', 'STT')}</th>
                  <th className="py-2.5 px-3">{t('print.col_date', 'Ngày')}</th>
                  <th className="py-2.5 px-3">{t('print.col_category', 'Phân loại')}</th>
                  <th className="py-2.5 px-3">{t('print.col_reason', 'Lý do thu / chi')}</th>
                  <th className="py-2.5 px-3 text-right">{t('print.col_amount', 'Số tiền (VNĐ)')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {completedTx.map((tx, idx) => {
                  const cat = catMap.get(tx.categoryId);
                  const isInc = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">{formatDate(tx.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{cat?.name || t('transactions.category_other', 'Khác')}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-sm">{tx.description}</td>
                      <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                        isInc ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isInc ? '+' : '-'} {formatVND(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
            <div>
              <p className="font-bold text-slate-800 uppercase">{sign1Title}</p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">{t('print.sign_note', '(Ký và ghi rõ họ tên)')}</p>
              <div className="h-16" />
              <p className="font-semibold text-slate-700">{sign1Name}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 uppercase">{sign2Title}</p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">{t('print.sign_note', '(Ký và ghi rõ họ tên)')}</p>
              <div className="h-16" />
              <p className="font-semibold text-slate-700">{sign2Name}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 uppercase">{sign3Title}</p>
              <p className="text-[11px] text-slate-400 italic mt-0.5">{t('print.sign_note', '(Ký và ghi rõ họ tên)')}</p>
              <div className="h-16" />
              <p className="font-semibold text-slate-700">{sign3Name}</p>
            </div>
          </div>

          {/* Footer Note */}
          {footerNote && (
            <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 italic">
              {footerNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
