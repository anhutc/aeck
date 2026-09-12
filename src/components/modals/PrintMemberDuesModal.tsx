import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Printer,
  ReceiptText,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Sparkles,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { Member, ContributionCampaign, Fund, BankSettings, AppBranding } from '../../types';
import { formatVND, formatDate, getVietQRUrl, getMemberRoles } from '../../utils/formatters';
import { useFeedback } from '../../context/FeedbackContext';

interface PrintMemberDuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  campaigns: ContributionCampaign[];
  funds?: Fund[];
  bankSettings?: BankSettings;
  branding?: AppBranding;
  defaultCampaignId?: string;
  isAdmin?: boolean;
}

export interface DebtBreakdownItem {
  id: string;
  title: string;
  type: 'yearly' | 'campaign';
  required: number;
  paid: number;
  owed: number;
  launchDate?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt?: string;
  note?: string;
  fundName?: string;
}

export interface MemberDuesRow {
  member: Member;
  roles: string[];
  type: 'yearly' | 'campaign' | 'exempt';
  totalRequired: number;
  totalPaid: number;
  totalRemaining: number;
  isPaidInFull: boolean;
  isExempt: boolean;
  hasDebt: boolean;
  debtBreakdown: DebtBreakdownItem[];
  allBreakdown: DebtBreakdownItem[];
}

export const PrintMemberDuesModal: React.FC<PrintMemberDuesModalProps> = ({
  isOpen,
  onClose,
  members,
  campaigns,
  funds,
  bankSettings,
  branding,
  defaultCampaignId = 'all',
  isAdmin = false,
}) => {
  const { showToast } = useFeedback();

  // Campaign scope
  const [campaignScope, setCampaignScope] = useState<string>(defaultCampaignId);
  // Default debt filter
  const [filterDebt, setFilterDebt] = useState<'unpaid_only' | 'all' | 'paid_only'>('unpaid_only');
  // Default status filter to 'all' so no member with debt is hidden
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all');
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Display toggles
  const [showQR, setShowQR] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [showPhone, setShowPhone] = useState<boolean>(true);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const printCardRef = useRef<HTMLDivElement>(null);

  // App branding info
  const appTitle = branding?.appTitle?.trim() || 'SỔ QUỸ AE CÂY KHẾ';
  const appSubtitle = branding?.appSubtitle?.trim() || 'Minh Bạch - Rõ Ràng - Kịp Thời';
  const treasurerName = branding?.treasurerName?.trim() || 'Ban Quản Trị Quỹ';
  const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';

  // Funds map for fast lookup
  const fundsMap = useMemo(() => {
    const map = new Map<string, string>();
    funds?.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [funds]);

  // Compute dues rows based on campaign scope
  const computedRows: MemberDuesRow[] = useMemo(() => {
    return members
      .filter((m) => {
        if (statusFilter === 'active' && m.status !== 'active') return false;
        return true;
      })
      .map((member) => {
        const roles = getMemberRoles(member);
        const debtBreakdown: DebtBreakdownItem[] = [];
        const allBreakdown: DebtBreakdownItem[] = [];

        let totalRequired = 0;
        let totalPaid = 0;

        if (member.contributionType === 'exempt') {
          return {
            member,
            roles,
            type: 'exempt' as const,
            totalRequired: 0,
            totalPaid: 0,
            totalRemaining: 0,
            isPaidInFull: true,
            isExempt: true,
            hasDebt: false,
            debtBreakdown: [],
            allBreakdown: [],
          };
        }

        if (campaignScope === 'all') {
          // 1. If member has yearly contribution
          if (member.contributionType === 'yearly') {
            const yReq = member.yearlyContributionAmount || 0;
            const yPaid = member.yearlyPaidAmount || 0;
            const yRem = Math.max(0, yReq - yPaid);
            totalRequired += yReq;
            totalPaid += yPaid;

            const yearlyItem: DebtBreakdownItem = {
              id: 'yearly',
              title: 'Theo năm',
              type: 'yearly',
              required: yReq,
              paid: yPaid,
              owed: yRem,
              launchDate: member.yearlyPaidDate || (member.joinedDate ? member.joinedDate : `${new Date().getFullYear()}-01-01`),
              paidDate: member.yearlyPaidDate,
              note: member.specialNote,
            };

            if (yRem > 0) {
              debtBreakdown.push(yearlyItem);
            }
            allBreakdown.push(yearlyItem);
          }

          // 2. All campaigns member participates in
          campaigns.forEach((camp) => {
            const p = camp.participants?.find((part) => part.memberId === member.id);
            if (p) {
              const req =
                p.amountRequired !== undefined
                  ? p.amountRequired
                  : (p as any).amountExpected ?? camp.amountPerMember ?? 0;
              const paid = p.amountPaid || 0;
              const rem = Math.max(0, req - paid);
              totalRequired += req;
              totalPaid += paid;

              const campItem: DebtBreakdownItem = {
                id: camp.id,
                title: camp.title,
                type: 'campaign',
                required: req,
                paid,
                owed: rem,
                launchDate: camp.launchDate || camp.createdAt?.slice(0, 10) || camp.dueDate,
                dueDate: camp.dueDate,
                createdAt: camp.createdAt,
                paidDate: p.paidDate,
                note: p.note,
                fundName: fundsMap.get(camp.fundId),
              };

              if (rem > 0) {
                debtBreakdown.push(campItem);
              }
              allBreakdown.push(campItem);
            }
          });
        } else {
          // Specific campaign selected
          const camp = campaigns.find((c) => c.id === campaignScope);
          if (camp) {
            const p = camp.participants?.find((part) => part.memberId === member.id);
            if (p) {
              const req =
                p.amountRequired !== undefined
                  ? p.amountRequired
                  : (p as any).amountExpected ?? camp.amountPerMember ?? 0;
              const paid = p.amountPaid || 0;
              const rem = Math.max(0, req - paid);
              totalRequired = req;
              totalPaid = paid;

              const campItem: DebtBreakdownItem = {
                id: camp.id,
                title: camp.title,
                type: 'campaign',
                required: req,
                paid,
                owed: rem,
                launchDate: camp.launchDate || camp.createdAt?.slice(0, 10) || camp.dueDate,
                dueDate: camp.dueDate,
                createdAt: camp.createdAt,
                paidDate: p.paidDate,
                note: p.note,
                fundName: fundsMap.get(camp.fundId),
              };

              if (rem > 0) {
                debtBreakdown.push(campItem);
              }
              allBreakdown.push(campItem);
            }
          }
        }

        // Sắp xếp chi tiết từng khoản thiếu theo thời gian: MỚI Ở TRÊN, CŨ Ở DƯỚI
        const getBreakdownDateScore = (item: DebtBreakdownItem): number => {
          const d = item.launchDate || item.createdAt || item.dueDate || item.paidDate;
          if (!d) return 0;
          const t = new Date(d).getTime();
          return isNaN(t) ? 0 : t;
        };

        const sortNewestFirst = (a: DebtBreakdownItem, b: DebtBreakdownItem): number => {
          const timeA = getBreakdownDateScore(a);
          const timeB = getBreakdownDateScore(b);
          if (timeB !== timeA) {
            return timeB - timeA; // Mới ở trên (time lớn hơn xếp trước), cũ ở dưới
          }
          return a.title.localeCompare(b.title, 'vi');
        };

        debtBreakdown.sort(sortNewestFirst);
        allBreakdown.sort(sortNewestFirst);

        const totalRemaining = Math.max(0, totalRequired - totalPaid);
        const hasDebt = totalRemaining > 0;
        const isPaidInFull = totalRequired > 0 && totalRemaining === 0;

        return {
          member,
          roles,
          type: member.contributionType || 'campaign',
          totalRequired,
          totalPaid,
          totalRemaining,
          isPaidInFull,
          isExempt: false,
          hasDebt,
          debtBreakdown,
          allBreakdown,
        };
      })
      .sort((a, b) => {
        // Sort debtors first, then by remaining descending, then by name
        if (a.hasDebt && !b.hasDebt) return -1;
        if (!a.hasDebt && b.hasDebt) return 1;
        if (b.totalRemaining !== a.totalRemaining) return b.totalRemaining - a.totalRemaining;
        return a.member.name.localeCompare(b.member.name, 'vi');
      });
  }, [members, campaigns, campaignScope, statusFilter, fundsMap]);

  // Overall statistics for the report
  const summaryStats = useMemo(() => {
    const totalMembers = computedRows.length;
    const unpaidCount = computedRows.filter((r) => r.hasDebt).length;
    const paidFullCount = computedRows.filter((r) => r.isPaidInFull).length;
    const exemptCount = computedRows.filter((r) => r.isExempt).length;
    const grandRemainingSum = computedRows.reduce((acc, r) => acc + r.totalRemaining, 0);

    return {
      totalMembers,
      unpaidCount,
      paidFullCount,
      exemptCount,
      grandRemainingSum,
    };
  }, [computedRows]);

  // Filtered rows according to filterDebt, status, and searchQuery
  const displayedRows = useMemo(() => {
    return computedRows.filter((r) => {
      // Debt status filter
      if (filterDebt === 'unpaid_only' && !r.hasDebt) return false;
      if (filterDebt === 'paid_only' && !r.isPaidInFull) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.member.name.toLowerCase().includes(q);
        const matchPhone = r.member.phone?.toLowerCase().includes(q);
        const matchRole = r.roles.some((role) => role.toLowerCase().includes(q));
        if (!matchName && !matchPhone && !matchRole) return false;
      }

      return true;
    });
  }, [computedRows, filterDebt, searchQuery]);

  // Totals for displayed rows
  const displayedTotals = useMemo(() => {
    const totalRequiredSum = displayedRows.reduce((acc, r) => acc + r.totalRequired, 0);
    const totalPaidSum = displayedRows.reduce((acc, r) => acc + r.totalPaid, 0);
    const totalRemainingSum = displayedRows.reduce((acc, r) => acc + r.totalRemaining, 0);
    return {
      totalRequiredSum,
      totalPaidSum,
      totalRemainingSum,
    };
  }, [displayedRows]);

  // Security guard: Only Admin can access
  if (!isOpen || !isAdmin) return null;

  // VietQR generation url
  const qrUrl = bankSettings?.accountNumber
    ? getVietQRUrl(bankSettings, undefined, `${prefix} DONG QUY`)
    : '';

  // 1. Tải ảnh PNG chất lượng cao
  const handleDownloadImage = async () => {
    if (!printCardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const safeTitle = appTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      const fileName = `ThongKeDongQuy_${safeTitle}_${new Date().toISOString().slice(0, 10)}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Đã tạo và tải ảnh thống kê đóng quỹ thành công!', 'success');
    } catch (err) {
      console.error('Lỗi khi xuất ảnh:', err);
      showToast('Không thể xuất ảnh, vui lòng thử lại.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Sao chép ảnh vào Clipboard (để dán Ctrl+V vào Zalo/Messenger ngay lập tức)
  const handleCopyImage = async () => {
    if (!printCardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Không thể tạo blob ảnh');
        }

        try {
          if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setIsCopied(true);
            showToast('Đã sao chép ảnh vào bộ nhớ tạm! Nhấn Ctrl+V để dán.', 'success');
            setTimeout(() => setIsCopied(false), 3000);
          } else {
            // Fallback download if clipboard image writing is not supported
            handleDownloadImage();
            showToast('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp, đã tự động tải ảnh về máy!', 'info');
          }
        } catch (copyErr) {
          console.warn('Lỗi clipboard:', copyErr);
          handleDownloadImage();
          showToast('Đã tải ảnh về máy!', 'info');
        } finally {
          setIsExporting(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Lỗi sao chép ảnh:', err);
      showToast('Không thể sao chép ảnh, vui lòng thử lại.', 'error');
      setIsExporting(false);
    }
  };

  // 3. In trực tiếp
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="print-member-dues-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="print-member-dues-modal-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden"
      >
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-3 bg-slate-50/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Xuất Ảnh Thống Kê Công Nợ & Đóng Quỹ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Dành riêng Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị chi tiết toàn bộ ai còn nợ, nợ đợt nào, mức quy định và số tiền còn thiếu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="copy-dues-image-btn"
              onClick={handleCopyImage}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Sao chép ảnh"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCopied ? (
                <Check className="w-4 h-4 text-emerald-200" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{isCopied ? 'Đã sao chép!' : 'Sao chép ảnh'}</span>
            </button>

            <button
              id="download-dues-image-btn"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Tải ảnh PNG sắc nét về máy"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xs:inline">Tải ảnh PNG</span>
            </button>

            <button
              id="print-dues-page-btn"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="In ra giấy"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              id="close-print-dues-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
          {/* Top row: Scope, Filter Tabs, and Search */}
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
            {/* Scope select */}
            <div className="flex-1 flex items-center gap-1.5 min-w-[240px]">
              <label className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                <span>Khoản thu:</span>
              </label>
              <select
                id="dues-scope-select"
                value={campaignScope}
                onChange={(e) => setCampaignScope(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium truncate"
              >
                <option value="all">Toàn bộ các khoản (Tất cả đợt thu & Niên liễm)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    Chỉ đợt: {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-700/60 p-0.5 rounded-xl shrink-0">
            
              <button
                type="button"
                onClick={() => setFilterDebt('all')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  filterDebt === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>Tất cả ({summaryStats.totalMembers})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterDebt('unpaid_only')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterDebt === 'unpaid_only'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Còn thiếu ({summaryStats.unpaidCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterDebt('paid_only')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterDebt === 'paid_only'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Đã xong ({summaryStats.paidFullCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, SĐT..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bottom row: View Mode & Display switches */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
            {/* View Mode & Status */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Dạng bảng đối soát chi tiết"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Dạng bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Dạng thẻ từng người nợ"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Dạng thẻ</span>
                </button>
              </div>

              {/* Status filter */}
              <select
                id="dues-status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Bao gồm tất cả thành viên (cả nghỉ/chuyển)</option>
                <option value="active">Chỉ thành viên đang hoạt động</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Chi tiết từng khoản thiếu
                </span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 dark:text-slate-300">Hiện SĐT</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showQR}
                  onChange={(e) => setShowQR(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 dark:text-slate-300">Mã VietQR</span>
              </label>
            </div>
          </div>
        </div>

        {/* Visual Preview Container - Normal block scrolling container to avoid flex stretch overflow bugs */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/70 dark:bg-slate-950/60 min-h-0">
          {/* Print Card Element - Target for html2canvas */}
          <div
            ref={printCardRef}
            id="member-dues-printable-card"
            className="w-full max-w-[860px] mx-auto bg-white text-slate-900 shadow-xl rounded-2xl border border-slate-200 p-5 sm:p-7 font-sans relative"
          >
            {/* Top Brand Accent Stripe */}
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 rounded-full mb-5" />

            {/* Report Header */}
            <div className="border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold tracking-wider uppercase">
                      {appTitle}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      {campaignScope === 'all'
                        ? 'Toàn bộ các khoản thu'
                        : campaigns.find((c) => c.id === campaignScope)?.title || 'Đợt thu'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {campaignScope === 'all'
                      ? 'ĐÓNG QUỸ THÀNH VIÊN'
                      : `BÁO CÁO TIẾN ĐỘ & CÔNG NỢ: ${campaigns.find((c) => c.id === campaignScope)?.title?.toUpperCase() || ''}`}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">{appSubtitle}</p>
                </div>

                <div className="text-right text-xs text-slate-500 shrink-0">
                  <div className="font-semibold text-slate-800">
                    Ngày lập: {formatDate(new Date().toISOString().slice(0, 10))}
                  </div>
                  <div className="mt-0.5">
                    Thủ quỹ: <span className="font-bold text-slate-700">{treasurerName}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {filterDebt === 'unpaid_only' ? 'Danh sách người còn nợ' : filterDebt === 'paid_only' ? 'Người đã nộp đủ' : 'Tất cả thành viên'}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Statistics KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Thành viên
                </div>
                <div className="text-lg font-black text-slate-800 mt-0.5">
                  {summaryStats.totalMembers}{' '}
                  <span className="text-xs font-normal text-slate-500">người</span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã nộp đủ 100%</span>
                </div>
                <div className="text-lg font-black text-emerald-700 mt-0.5">
                  {summaryStats.paidFullCount}{' '}
                  <span className="text-xs font-normal text-emerald-600">người</span>
                </div>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-2.5 text-center">
                <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Còn nợ / thiếu</span>
                </div>
                <div className="text-lg font-black text-rose-700 mt-0.5">
                  {summaryStats.unpaidCount}{' '}
                  <span className="text-xs font-normal text-rose-600">người</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-xl p-2.5 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-extrabold text-orange-800 uppercase tracking-wider">
                  Tổng cần thu
                </div>
                <div className="text-lg font-black text-orange-700 mt-0.5 tracking-tight">
                  {formatVND(summaryStats.grandRemainingSum)}
                </div>
              </div>
            </div>

            {/* Empty State Banner if no records in view */}
            {displayedRows.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 my-4">
                {filterDebt === 'unpaid_only' && summaryStats.unpaidCount === 0 ? (
                  <div className="space-y-2">
                    <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      Tuyệt vời! Tất cả thành viên đã hoàn thành nộp quỹ
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Hiện tại không có thành viên nào nợ quỹ trong phạm vi này. Toàn bộ các khoản thu đã được đóng đầy đủ 100%.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setFilterDebt('all')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                      >
                        Xem danh sách tất cả thành viên ({summaryStats.totalMembers} người)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      Không có thành viên nào phù hợp với bộ lọc tìm kiếm
                    </p>
                    <p className="text-xs text-slate-400">
                      Hãy thử đổi từ khóa tìm kiếm hoặc chọn hiển thị tất cả thành viên.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* MODE 1: Table View */}
            {displayedRows.length > 0 && viewMode === 'table' && (
              <div className="overflow-hidden border border-slate-200 rounded-xl mb-5 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3 text-center w-9">#</th>
                      <th className="py-2.5 px-3 w-44">Thành viên</th>
                      <th className="py-2.5 px-3 text-right w-24">Phải đóng</th>
                      <th className="py-2.5 px-3 text-right w-24">Đã nộp</th>
                      <th className="py-2.5 px-3 text-right w-28">Còn thiếu</th>
                      <th className="py-2.5 px-3">Chi tiết từng khoản thiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {displayedRows.map((row, idx) => (
                      <tr
                        key={row.member.id}
                        className={
                          row.hasDebt
                            ? 'bg-rose-50/25 hover:bg-rose-50/40 transition-colors'
                            : 'hover:bg-slate-50 transition-colors'
                        }
                      >
                        {/* STT */}
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] align-top">
                          {idx + 1}
                        </td>

                        {/* Thành viên */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{row.member.name}</span>
                          </div>
                          {showPhone && row.member.phone && (
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{row.member.phone}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {row.type === 'yearly'
                              ? 'Chế độ: Theo năm'
                              : row.type === 'exempt'
                              ? 'Chế độ: Miễn đóng'
                              : 'Chế độ: Theo đợt'}
                          </div>
                        </td>

                        {/* Phải đóng */}
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-700 align-top">
                          {formatVND(row.totalRequired)}
                        </td>

                        {/* Đã nộp */}
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 align-top">
                          <div>{formatVND(row.totalPaid)}</div>
                          {row.totalRequired > 0 && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              ({Math.round((row.totalPaid / row.totalRequired) * 100)}%)
                            </div>
                          )}
                        </td>

                        {/* Còn thiếu (Nợ) */}
                        <td className="py-2.5 px-3 text-right align-top">
                          {row.totalRemaining > 0 ? (
                            <div className="font-black text-rose-600 text-[13px]">
                              {formatVND(row.totalRemaining)}
                            </div>
                          ) : (
                            <div className="text-slate-400 font-medium">0 ₫</div>
                          )}
                        </td>

                        {/* Chi tiết từng khoản thiếu */}
                        <td className="py-2.5 px-3 align-top">
                          {row.isExempt ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                              Miễn đóng quỹ
                            </span>
                          ) : row.isPaidInFull ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Đã nộp đủ 100%</span>
                            </span>
                          ) : row.hasDebt ? (
                            <div className="space-y-1.5">
                              {showDetails && row.debtBreakdown.length > 0 ? (
                                <div className="space-y-1">
                                  {row.debtBreakdown.map((item, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className="bg-rose-50/80 border border-rose-200/80 rounded px-2 py-1 text-[11px] text-slate-800"
                                    >
                                      <div className="flex items-center justify-between font-bold text-slate-900 gap-2">
                                        <span className="truncate">📌 {item.title}</span>
                                        <span className="text-rose-700 font-extrabold shrink-0">
                                          {formatVND(item.owed)}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500 mt-0.5">
                                        {item.launchDate && (
                                          <span className="text-slate-600 font-medium">📅 {formatDate(item.launchDate)}</span>
                                        )}
                                        <span>Mức: {formatVND(item.required)}</span>
                                        {item.paid > 0 && (
                                          <span className="text-emerald-700 font-semibold">• Đã nộp: {formatVND(item.paid)}</span>
                                        )}
                                        {item.note && <span className="italic text-slate-400">• {item.note}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <span>Thiếu tổng: {formatVND(row.totalRemaining)}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa phát sinh thu</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider text-[11px]">
                        TỔNG CỘNG ({displayedRows.length} thành viên)
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatVND(displayedTotals.totalRequiredSum)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">
                        {formatVND(displayedTotals.totalPaidSum)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-black text-sm">
                        {formatVND(displayedTotals.totalRemainingSum)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-normal">
                        Đối soát trực tiếp từ sổ quỹ điện tử
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* MODE 2: Card View (Dạng thẻ công nợ theo từng thành viên) */}
            {displayedRows.length > 0 && viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5 items-start">
                {displayedRows.map((row, idx) => (
                  <div
                    key={row.member.id}
                    className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all h-fit ${
                      row.hasDebt
                        ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                        : 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                    }`}
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-mono text-slate-400 font-bold">#{idx + 1}</span>
                            <h4 className="font-bold text-slate-900 text-sm truncate">{row.member.name}</h4>
                            {row.roles[0] && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-white text-slate-600 rounded border border-slate-200 shrink-0">
                                {row.roles[0]}
                              </span>
                            )}
                          </div>
                          {showPhone && row.member.phone && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{row.member.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0 text-right">
                          {row.isExempt ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              Miễn đóng
                            </span>
                          ) : row.isPaidInFull ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã nộp đủ</span>
                            </span>
                          ) : (
                            <div className="bg-rose-100 border border-rose-300 text-rose-800 px-2 py-1 rounded-lg">
                              <div className="text-[9px] font-bold uppercase text-rose-600">CÒN THIẾU</div>
                              <div className="text-sm font-black text-rose-700 leading-tight font-mono">
                                {formatVND(row.totalRemaining)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Overall Progress for member */}
                      {row.totalRequired > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mb-1">
                            <span>
                              Đã nộp: <strong className="text-emerald-700 font-bold">{formatVND(row.totalPaid)}</strong>
                            </span>
                            <span>
                              Tổng phải đóng: <strong className="text-slate-800 font-bold">{formatVND(row.totalRequired)}</strong>
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.isPaidInFull ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((row.totalPaid / row.totalRequired) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Breakdown of debts */}
                      {showDetails && row.debtBreakdown.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                            <span>Chi tiết các đợt nợ ({row.debtBreakdown.length}):</span>
                          </div>
                          <div className="space-y-1">
                            {row.debtBreakdown.map((item, dIdx) => (
                              <div
                                key={dIdx}
                                className="bg-white/95 border border-rose-200/80 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 truncate">📌 {item.title}</span>
                                    {item.paid > 0 && (
                                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-medium border border-emerald-100 shrink-0">
                                        Đã nộp {formatVND(item.paid)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    {item.launchDate && (
                                      <span className="text-slate-600 font-medium">📅 {formatDate(item.launchDate)} •</span>
                                    )}
                                    <span>
                                      Mức: <strong className="text-slate-700">{formatVND(item.required)}</strong>
                                    </span>
                                    {item.note && (
                                      <span className="italic text-slate-400 truncate max-w-[150px]">
                                        ({item.note})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[9px] font-bold text-rose-500 uppercase">Thiếu</div>
                                  <div className="text-xs font-black text-rose-700 font-mono">
                                    {formatVND(item.owed)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment & VietQR Footer Section */}
            {showQR && bankSettings?.accountNumber && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>THÔNG TIN CHUYỂN KHOẢN ĐÓNG QUỸ</span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      Ngân hàng: <span className="font-bold text-slate-900">{bankSettings.bankName}</span>{' '}
                      ({bankSettings.bankId})
                    </div>
                    <div>
                      Số tài khoản:{' '}
                      <span className="font-mono font-bold text-base text-blue-700 tracking-wider">
                        {bankSettings.accountNumber}
                      </span>
                    </div>
                    <div>
                      Chủ tài khoản:{' '}
                      <span className="font-bold uppercase text-slate-900">{bankSettings.accountName}</span>
                    </div>
                    <div className="pt-0.5">
                      Cú pháp:{' '}
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        [HỌ TÊN] {prefix}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic pt-1">
                    * Thành viên vui lòng quét mã VietQR hoặc ghi đúng cú pháp để thủ quỹ cập nhật nhanh chóng.
                  </p>
                </div>

                {qrUrl && (
                  <div className="flex flex-col items-center shrink-0">
                    <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
                      <img
                        src={qrUrl}
                        alt="Mã VietQR"
                        crossOrigin="anonymous"
                        className="w-32 h-32 object-contain rounded-lg"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 tracking-wider uppercase">
                      Quét QR chuyển khoản
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Signature & Notice */}
            <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span>Báo cáo điện tử tự động trích xuất từ hệ thống quản lý sổ quỹ</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700">{treasurerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info tip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col xs:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Mẹo: Nhấn nút <strong>"Sao chép ảnh"</strong> để gửi ảnh ngay mà không cần tải file!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
