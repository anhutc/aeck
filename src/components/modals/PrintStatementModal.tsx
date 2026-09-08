import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileDown, 
  Loader2,
  CheckCircle2,
  Info
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { Category, Fund, Transaction, AppBranding } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  funds: Fund[];
  categories: Category[];
  activeFundId?: string;
  branding?: AppBranding;
}

interface StatementPageData {
  pageNumber: number;
  transactions: Transaction[];
  startIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  showSummary: boolean;
  showSignatures: boolean;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  funds,
  categories,
  activeFundId,
  branding,
}) => {
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // References to each page canvas element
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Active fund name strictly follows application branding
  const appFundName = branding?.appTitle?.trim() || 'AE Cây Khế';

  // Row density selection: 'normal' (standard A4 ~24 rows/page), 'compact' (~30 rows/page), 'spacious' (~16 rows/page)
  type RowDensity = 'normal' | 'compact' | 'spacious';
  const [density, setDensity] = useState<RowDensity>('normal');

  // Get active fund
  const fund = useMemo(() => {
    const raw = funds.find(f => f.id === activeFundId) || funds[0];
    return { 
      id: raw?.id || 'fund_general', 
      name: appFundName, 
      balance: raw?.balance || 0 
    };
  }, [funds, activeFundId, appFundName]);

  const catMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);

  // Completed transactions filtered by fund
  const completedTx = useMemo(() => {
    return transactions.filter(t => t.status === 'completed' && (!activeFundId || t.fundId === activeFundId));
  }, [transactions, activeFundId]);

  const totalIncome = useMemo(() => {
    return completedTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [completedTx]);

  const totalExpense = useMemo(() => {
    return completedTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [completedTx]);

  const netBalance = totalIncome - totalExpense;

  // Statement branding & signature values strictly from centralized Settings (branding)
  const headerTitle = branding?.statementHeaderTitle?.trim() || 'BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ';
  const subtitle = branding?.statementSubtitle?.trim() || 'Trích xuất tự động từ hệ thống quản lý thu chi minh bạch';
  
  const sign1Title = branding?.statementSignatory1Title?.trim() || 'Người lập biểu';
  const sign1Name = branding?.statementSignatory1Name?.trim() || 'Kế toán quỹ';
  
  const sign2Title = branding?.statementSignatory2Title?.trim() || 'Thủ quỹ';
  const sign2Name = branding?.statementSignatory2Name?.trim() || branding?.treasurerName?.trim() || 'Trần Thị Mai';
  
  const sign3Title = branding?.statementSignatory3Title?.trim() || 'Trưởng ban duyệt';
  const sign3Name = branding?.statementSignatory3Name?.trim() || 'Đại diện ban quản lý';
  
  const footerNote = branding?.statementFooterNote?.trim() || 'Báo cáo này được trích xuất tự động từ hệ thống quản lý thu chi minh bạch và có giá trị lưu hành nội bộ.';

  const showSummary = branding?.statementShowSummary !== false;
  const showSign1 = branding?.statementShowSignatory1 !== false;
  const showSign2 = branding?.statementShowSignatory2 !== false;
  const showSign3 = branding?.statementShowSignatory3 !== false;
  const showFooterNote = branding?.statementShowFooterNote !== false;

  const activeSignatoriesCount = [showSign1, showSign2, showSign3].filter(Boolean).length;

  // Density configuration: row capacities for page 1, middle pages, and last page with signatures
  const densityConfig = useMemo(() => {
    switch (density) {
      case 'compact':
        return {
          p1Max: showSummary ? 25 : 29,
          singlePageMax: showSummary ? (activeSignatoriesCount > 0 ? 20 : 27) : (activeSignatoriesCount > 0 ? 24 : 31),
          subsequentMax: 32,
          lastPageWithSignMax: 24,
          rowPy: 'py-1.5 px-2.5',
          fontSize: 'text-xs',
          label: 'Tiết kiệm',
        };
      case 'spacious':
        return {
          p1Max: showSummary ? 14 : 17,
          singlePageMax: showSummary ? (activeSignatoriesCount > 0 ? 10 : 15) : (activeSignatoriesCount > 0 ? 13 : 18),
          subsequentMax: 18,
          lastPageWithSignMax: 14,
          rowPy: 'py-2.5 px-3',
          fontSize: 'text-xs',
          label: 'Rộng rãi',
        };
      case 'normal':
      default:
        return {
          p1Max: showSummary ? 21 : 25,
          singlePageMax: showSummary ? (activeSignatoriesCount > 0 ? 15 : 23) : (activeSignatoriesCount > 0 ? 19 : 27),
          subsequentMax: 27,
          lastPageWithSignMax: 19,
          rowPy: 'py-2 px-2.5',
          fontSize: 'text-xs',
          label: 'Chuẩn A4',
        };
    }
  }, [density, showSummary, activeSignatoriesCount]);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const documentCode = useMemo(() => {
    const safeFundCode = (fund.id || 'QUY').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `SKQ-${safeFundCode}-${dateStr}`;
  }, [fund.id]);

  // Pagination calculation: Split transactions across pages with optimal layout based on chosen density
  const pages: StatementPageData[] = useMemo(() => {
    if (completedTx.length === 0) {
      return [{
        pageNumber: 1,
        transactions: [],
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        showSummary,
        showSignatures: activeSignatoriesCount > 0,
      }];
    }

    // If all items fit neatly onto a single page (including summary & signatures)
    if (completedTx.length <= densityConfig.singlePageMax) {
      return [{
        pageNumber: 1,
        transactions: completedTx,
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        showSummary,
        showSignatures: activeSignatoriesCount > 0,
      }];
    }

    const result: StatementPageData[] = [];
    const p1Count = densityConfig.p1Max;

    result.push({
      pageNumber: 1,
      transactions: completedTx.slice(0, p1Count),
      startIndex: 0,
      isFirstPage: true,
      isLastPage: false,
      showSummary,
      showSignatures: false,
    });

    let currentIdx = p1Count;
    const lastPageMax = activeSignatoriesCount > 0 
      ? densityConfig.lastPageWithSignMax 
      : densityConfig.subsequentMax;

    while (currentIdx < completedTx.length) {
      const remaining = completedTx.length - currentIdx;
      const pageNum = result.length + 1;

      if (remaining <= lastPageMax) {
        // Fits entirely on the final page with signatures
        result.push({
          pageNumber: pageNum,
          transactions: completedTx.slice(currentIdx, currentIdx + remaining),
          startIndex: currentIdx,
          isFirstPage: false,
          isLastPage: true,
          showSummary: false,
          showSignatures: activeSignatoriesCount > 0,
        });
        currentIdx += remaining;
      } else if (remaining <= lastPageMax + 8) {
        // Anti-orphan guard: split remaining evenly between this page and final page
        const take = Math.floor(remaining / 2);
        result.push({
          pageNumber: pageNum,
          transactions: completedTx.slice(currentIdx, currentIdx + take),
          startIndex: currentIdx,
          isFirstPage: false,
          isLastPage: false,
          showSummary: false,
          showSignatures: false,
        });
        currentIdx += take;
      } else {
        const take = densityConfig.subsequentMax;
        result.push({
          pageNumber: pageNum,
          transactions: completedTx.slice(currentIdx, currentIdx + take),
          startIndex: currentIdx,
          isFirstPage: false,
          isLastPage: false,
          showSummary: false,
          showSignatures: false,
        });
        currentIdx += take;
      }
    }

    return result;
  }, [completedTx, showSummary, activeSignatoriesCount, densityConfig]);

  const totalPages = pages.length;

  // 1. Export as High-Resolution PNG Image (Single page or multi-page unified scroll image)
  const handleExportImage = async () => {
    setIsExportingImage(true);
    try {
      const canvases: HTMLCanvasElement[] = [];

      for (let i = 0; i < pages.length; i++) {
        const el = pageRefs.current[i];
        if (el) {
          const c = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          canvases.push(c);
        }
      }

      if (canvases.length === 0) {
        throw new Error('Không tìm thấy nội dung để xuất ảnh.');
      }

      const safeFundName = appFundName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      const fileName = `BaoCao_${safeFundName}_${new Date().toISOString().slice(0, 10)}.png`;

      let finalDataUrl = '';

      if (canvases.length === 1) {
        finalDataUrl = canvases[0].toDataURL('image/png');
      } else {
        // Multi-page: Merge onto a master vertical canvas with subtle page dividers for easy mobile scrolling
        const masterCanvas = document.createElement('canvas');
        const width = canvases[0].width;
        const pageGap = 24;
        const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0) + (canvases.length - 1) * pageGap;

        masterCanvas.width = width;
        masterCanvas.height = totalHeight;

        const ctx = masterCanvas.getContext('2d');
        if (!ctx) throw new Error('Không thể khởi tạo đồ họa.');

        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, width, totalHeight);

        let yOffset = 0;
        for (const c of canvases) {
          ctx.drawImage(c, 0, yOffset);
          yOffset += c.height + pageGap;
        }

        finalDataUrl = masterCanvas.toDataURL('image/png');
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = finalDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Đã tạo và tải ảnh báo cáo (${pages.length} trang) thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi khi tạo ảnh báo cáo:', err);
      showToast('Không thể tạo ảnh báo cáo, vui lòng thử lại.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  // 2. Export as Standard Multi-Page PDF file with guaranteed new header on every page
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Standard A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pageRefs.current[i];
        if (!pageEl) continue;

        if (i > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const safeFundName = appFundName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      const fileName = `BaoCao_${safeFundName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      showToast(`Đã lưu file PDF báo cáo (${pages.length} trang có tiêu đề đầy đủ)!`, 'success');
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err);
      showToast('Không thể xuất PDF, vui lòng thử lại.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="print-modal-overlay"
      className="fixed inset-0 z-50 p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-hidden"
    >
      <div 
        id="print-modal-card" 
        className="bg-slate-100 text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Controls Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {t('print.preview_title', 'Bản xem trước sao kê & báo cáo quỹ')}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalPages} {totalPages === 1 ? 'trang' : 'trang'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Density Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-medium text-slate-500 pl-2 pr-1 hidden lg:inline">Dòng:</span>
              <button
                type="button"
                onClick={() => setDensity('normal')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  density === 'normal'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chuẩn A4 (~24 dòng/trang, tối ưu lấp đầy trang in)"
              >
                Chuẩn A4
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tiết kiệm (~30 dòng/trang, giảm tối đa số trang)"
              >
                Tiết kiệm
              </button>
              <button
                type="button"
                onClick={() => setDensity('spacious')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  density === 'spacious'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Thoáng (~16 dòng/trang, phù hợp khi diễn giải thu chi dài)"
              >
                Thoáng
              </button>
            </div>

            {/* Export as Image Button */}
            <button
              type="button"
              id="export-statement-image-btn"
              onClick={handleExportImage}
              disabled={isExportingImage || isExportingPDF}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Tải ảnh PNG rõ nét để gửi qua Zalo / Messenger"
            >
              {isExportingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span>{isExportingImage ? 'Đang tạo ảnh...' : 'Tạo ảnh'}</span>
            </button>

            {/* Export as PDF Button with multi-page headers */}
            <button
              type="button"
              id="export-statement-pdf-btn"
              onClick={handleExportPDF}
              disabled={isExportingImage || isExportingPDF}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Lưu tệp PDF tải thẳng về máy tính (mỗi trang có tiêu đề riêng)"
            >
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPDF ? 'Đang xuất PDF...' : 'Lưu PDF'}</span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              id="close-print-modal-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Pages Area */}
        <div 
          id="statement-pages-scroll-area"
          className="p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto flex-1 bg-slate-200/60"
        >
          {pages.map((page, pageIdx) => (
            <div key={page.pageNumber} className="relative group">
              {/* Page Indicator Badge */}
              <div className="flex items-center justify-between max-w-[794px] mx-auto mb-1.5 px-2 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Trang {page.pageNumber} / {totalPages}</span>
                  {page.isFirstPage && <span className="text-slate-400">• Trang mở đầu & Tổng hợp</span>}
                  {page.isLastPage && <span className="text-slate-400">• Trang kết thúc & Chữ ký</span>}
                </span>
                <span className="font-mono text-[10px] text-slate-400">Khổ A4 (210 × 297 mm)</span>
              </div>

              {/* A4 Sheet Canvas */}
              <div
                ref={(el) => { pageRefs.current[pageIdx] = el; }}
                id={`statement-page-${page.pageNumber}`}
                className="statement-page-canvas w-full max-w-[794px] bg-white text-slate-900 p-8 sm:p-10 rounded-xl border border-slate-300 shadow-md mx-auto flex flex-col justify-between"
                style={{ minHeight: '1123px' }}
              >
                {/* Top Section: Header + Table */}
                <div className="space-y-5">
                  {/* Page Header: Distinct header for Page 1 vs Subsequent Pages */}
                  {page.isFirstPage ? (
                    /* PAGE 1: Full Primary Header */
                    <div className="border-b-2 border-slate-900 pb-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                          {headerTitle}
                        </h1>
                        {subtitle && (
                          <p className="text-xs text-slate-500 font-normal mt-0.5">
                            {subtitle}
                          </p>
                        )}
                        <p className="text-xs text-slate-700 font-medium mt-1">
                          <span className="font-bold text-slate-900">{appFundName}</span>
                          <span className="mx-1.5 text-slate-400">•</span>
                          <span>Số dư hiện tại: <strong className="font-bold text-blue-700 font-mono">{formatVND(fund.balance)}</strong></span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right text-xs text-slate-500 font-mono shrink-0">
                        <p>Ngày lập: <span className="font-semibold text-slate-700">{currentDateFormatted}</span></p>
                        <p>Mã tài liệu: <span className="font-semibold text-slate-700">{documentCode}</span></p>
                        <p className="font-bold text-indigo-700 text-xs mt-1">Trang 1 / {totalPages}</p>
                      </div>
                    </div>
                  ) : (
                    /* PAGE 2..N: Formal Continuation Header */
                    <div className="border-b-2 border-slate-900 pb-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                            {headerTitle}
                          </h2>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            Tiếp theo
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          <span className="font-bold text-slate-900">{appFundName}</span>
                          <span className="mx-1.5 text-slate-400">•</span>
                          <span>Số dư: <strong className="font-bold text-blue-700 font-mono">{formatVND(fund.balance)}</strong></span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right text-xs text-slate-500 font-mono shrink-0">
                        <p>Ngày lập: {currentDateFormatted}</p>
                        <p className="font-bold text-indigo-700 text-xs mt-0.5">Trang {page.pageNumber} / {totalPages}</p>
                      </div>
                    </div>
                  )}

                  {/* Financial Summary KPI Box (Page 1 only, if enabled in Settings) */}
                  {page.showSummary && (
                    <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">{t('print.total_income_label', 'Tổng thu ghi nhận')}</p>
                        <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5 font-mono">+{formatVND(totalIncome)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">{t('print.total_expense_label', 'Tổng chi tiêu')}</p>
                        <p className="text-base sm:text-lg font-bold text-rose-600 mt-0.5 font-mono">-{formatVND(totalExpense)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium">{t('print.net_cashflow_label', 'Dòng tiền ròng')}</p>
                        <p className={`text-base sm:text-lg font-bold mt-0.5 font-mono ${netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                          {netBalance >= 0 ? '+' : ''}{formatVND(netBalance)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Transactions Table for this page */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
                          <th className="py-2 px-2.5 w-10 text-center">{t('print.col_no', 'STT')}</th>
                          <th className="py-2 px-2.5 w-24">{t('print.col_date', 'Ngày')}</th>
                          <th className="py-2 px-2.5 w-32">{t('print.col_category', 'Phân loại')}</th>
                          <th className="py-2 px-2.5">{t('print.col_reason', 'Lý do thu / chi')}</th>
                          <th className="py-2 px-2.5 text-right w-32">{t('print.col_amount', 'Số tiền (VNĐ)')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {page.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                              Chưa có giao dịch hoàn tất nào trong quỹ này.
                            </td>
                          </tr>
                        ) : (
                          page.transactions.map((tx, idx) => {
                            const cat = catMap.get(tx.categoryId);
                            const isInc = tx.type === 'income';
                            const stt = page.startIndex + idx + 1;

                            return (
                              <tr key={tx.id} className="hover:bg-slate-50">
                                <td className={`${densityConfig.rowPy} text-slate-400 text-center font-mono`}>{stt}</td>
                                <td className={`${densityConfig.rowPy} whitespace-nowrap font-mono text-slate-600`}>{formatDate(tx.date)}</td>
                                <td className={`${densityConfig.rowPy}`}>
                                  <span className="font-semibold text-slate-800">{cat?.name || t('transactions.category_other', 'Khác')}</span>
                                </td>
                                <td className={`${densityConfig.rowPy} text-slate-700 leading-snug`}>{tx.description}</td>
                                <td className={`${densityConfig.rowPy} text-right font-bold whitespace-nowrap font-mono ${
                                  isInc ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                  {isInc ? '+' : '-'} {formatVND(tx.amount)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Section: Signatures & Page Footer (Anchored cleanly at bottom) */}
                <div className="space-y-4 pt-6 mt-6">
                  {/* Signatures Section: On Final Page only, based on Settings visibility */}
                  {page.showSignatures && activeSignatoriesCount > 0 && (
                    <div 
                      className={`grid gap-4 pt-4 border-t border-slate-300 text-center text-xs ${
                        activeSignatoriesCount === 1 
                          ? 'grid-cols-1 max-w-xs mx-auto' 
                          : activeSignatoriesCount === 2 
                          ? 'grid-cols-2' 
                          : 'grid-cols-3'
                      }`}
                    >
                      {showSign1 && (
                        <div>
                          <p className="font-bold text-slate-800 uppercase text-[11px]">{sign1Title}</p>
                          <p className="text-[10px] text-slate-400 italic mt-0.5">{t('print.sign_note', '(Ký và ghi rõ họ tên)')}</p>
                          <div className="h-16" />
                          <p className="font-semibold text-slate-700">{sign1Name}</p>
                        </div>
                      )}

                      {showSign2 && (
                        <div>
                          <p className="font-bold text-slate-800 uppercase text-[11px]">{sign2Title}</p>
                          <p className="text-[10px] text-slate-400 italic mt-0.5">{t('print.sign_note', '(Ký và ghi rõ họ tên)')}</p>
                          <div className="h-16" />
                          <p className="font-semibold text-slate-700">{sign2Name}</p>
                        </div>
                      )}

                      {showSign3 && (
                        <div>
                          <p className="font-bold text-slate-800 uppercase text-[11px]">{sign3Title}</p>
                          <p className="text-[10px] text-slate-400 italic mt-0.5">{t('print.sign_note', '(Ký và ghi rõ họ tên)')}</p>
                          <div className="h-16" />
                          <p className="font-semibold text-slate-700">{sign3Name}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footnote on Final Page */}
                  {page.isLastPage && showFooterNote && footerNote && (
                    <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 italic">
                      {footerNote}
                    </div>
                  )}

                  {/* Document Footer Bar on Every Page */}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>{appFundName} • Báo cáo thu chi minh bạch • Lưu hành nội bộ</span>
                    <span className="font-bold text-slate-600">Trang {page.pageNumber} / {totalPages}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
