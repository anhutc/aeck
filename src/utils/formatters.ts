import { BankSettings, Category, Fund, Transaction } from '../types';
import { exportTransactionsToExcelWithAnalytics } from './excelReport';

export { exportTransactionsToExcelWithAnalytics };

export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatThousands(val: number | string): string {
  const num = typeof val === 'number' ? val : parseAmountInput(val);
  if (!num || isNaN(num)) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function parseAmountInput(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input || typeof input !== 'string') return 0;
  
  const clean = input.trim().toLowerCase();
  if (!clean) return 0;

  // Handle patterns like "2tr5" -> 2.5 million, "1t5" -> 1.5 million
  const matchMixedTr = clean.match(/^(\d+)[tr|t](\d+)$/);
  if (matchMixedTr) {
    const main = parseInt(matchMixedTr[1], 10);
    const fraction = parseInt(matchMixedTr[2], 10);
    return main * 1_000_000 + fraction * 100_000;
  }

  // Handle "1.5tr", "1,5tr", "1.5m", "10tr"
  if (clean.includes('tr') || clean.includes('m')) {
    const numPart = clean.replace(/[tr|m|đ|d]/g, '').replace(/,/g, '.').trim();
    const val = parseFloat(numPart);
    return isNaN(val) ? 0 : Math.round(val * 1_000_000);
  }

  // Handle "500k", "50k"
  if (clean.includes('k')) {
    const numPart = clean.replace(/[k|đ|d]/g, '').replace(/,/g, '.').trim();
    const val = parseFloat(numPart);
    return isNaN(val) ? 0 : Math.round(val * 1_000);
  }

  // Handle "tỷ", "ty"
  if (clean.includes('tỷ') || clean.includes('ty')) {
    const numPart = clean.replace(/[tỷ|ty|đ|d]/g, '').replace(/,/g, '.').trim();
    const val = parseFloat(numPart);
    return isNaN(val) ? 0 : Math.round(val * 1_000_000_000);
  }

  // Standard numeric string with dots, commas, spaces or currency symbols
  const digitsOnly = clean.replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

const DIGITS_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigitsVi(n: number, isFirstGroup: boolean): string {
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;

  const result: string[] = [];

  if (hundreds > 0 || !isFirstGroup) {
    result.push(`${DIGITS_VI[hundreds]} trăm`);
  }

  if (tens > 1) {
    result.push(`${DIGITS_VI[tens]} mươi`);
    if (ones === 1) result.push('mốt');
    else if (ones === 4) result.push('tư');
    else if (ones === 5) result.push('lăm');
    else if (ones > 0) result.push(DIGITS_VI[ones]);
  } else if (tens === 1) {
    result.push('mười');
    if (ones === 5) result.push('lăm');
    else if (ones > 0) result.push(DIGITS_VI[ones]);
  } else if (tens === 0) {
    if (ones > 0) {
      if (hundreds > 0 || !isFirstGroup) {
        result.push('lẻ');
      }
      result.push(DIGITS_VI[ones]);
    }
  }

  return result.join(' ');
}

export function numberToVietnameseWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Không đồng';
  if (amount < 0) return 'Âm ' + numberToVietnameseWords(Math.abs(amount)).toLowerCase();

  const rounded = Math.round(amount);
  if (rounded === 0) return 'Không đồng';

  const SCALE = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  let numStr = rounded.toString();
  const groups: number[] = [];
  while (numStr.length > 0) {
    const chunk = numStr.slice(-3);
    groups.unshift(parseInt(chunk, 10));
    numStr = numStr.slice(0, -3);
  }

  const parts: string[] = [];
  const totalGroups = groups.length;

  for (let i = 0; i < totalGroups; i++) {
    const groupVal = groups[i];
    const scaleIndex = totalGroups - 1 - i;
    if (groupVal > 0) {
      const isFirst = i === 0;
      const groupText = readThreeDigitsVi(groupVal, isFirst);
      const scaleText = SCALE[scaleIndex] || '';
      parts.push(`${groupText} ${scaleText}`.trim());
    } else if (scaleIndex === 3 && totalGroups > 4) {
      parts.push('tỷ');
    }
  }

  const finalStr = parts.join(' ').replace(/\s+/g, ' ').trim() + ' đồng';
  return finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
}

export function formatNumberCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace('.0', '') + ' Tỷ';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.0', '') + ' Tr';
  }
  if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(0) + ' K';
  }
  return amount.toString();
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function getVietQRUrl(
  bank: BankSettings,
  amount?: number,
  addInfo?: string
): string {
  const bankId = bank.bankId || 'MB';
  const accNum = bank.accountNumber || '';
  const template = bank.qrTemplate || 'compact';
  
  let url = `https://img.vietqr.io/image/${bankId}-${accNum}-${template}.png`;
  const params: string[] = [];
  
  if (amount && amount > 0) {
    params.push(`amount=${Math.round(amount)}`);
  }
  if (addInfo) {
    params.push(`addInfo=${encodeURIComponent(addInfo)}`);
  }
  if (bank.accountName) {
    params.push(`accountName=${encodeURIComponent(bank.accountName)}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return url;
}

export function getMemberRoles(member: { roles?: string[]; role?: string }): string[] {
  if (Array.isArray(member.roles) && member.roles.length > 0) {
    return member.roles;
  }
  if (member.role) {
    return [member.role];
  }
  return ['Thành viên'];
}

export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'Trưởng ban':
      return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'Phó ban':
      return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'Thủ quỹ':
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'Kế toán':
      return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'Hậu cần':
      return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'Văn nghệ / Sự kiện':
      return 'bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';
    case 'Kỹ thuật':
      return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    case 'Đối ngoại':
      return 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
}

export async function exportTransactionsToExcel(
  transactions: Transaction[],
  fundsOrCategories: (Fund | Category)[],
  categoriesOrFunds?: (Category | Fund)[],
  customFundName?: string
): Promise<void> {
  return exportTransactionsToExcelWithAnalytics(
    transactions,
    fundsOrCategories,
    categoriesOrFunds,
    customFundName
  );
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  fundsOrCategories: (Fund | Category)[],
  categoriesOrFunds?: (Category | Fund)[],
  customFundName?: string
): void {
  const allItems = [...(fundsOrCategories || []), ...(categoriesOrFunds || [])];
  const catMap = new Map<string, string>();
  allItems.forEach(item => {
    if (item && 'id' in item && 'name' in item) {
      catMap.set(item.id, item.name);
    }
  });

  const fundItem = (fundsOrCategories || []).find(f => f && 'balance' in f) as Fund | undefined;
  const fundName = customFundName?.trim() || fundItem?.name?.trim() || 'AE Cây Khế';

  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach(t => {
    if (t.status === 'completed') {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    }
  });

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const metaRows = [
    `"SỔ QUỸ THU CHI - ${fundName.toUpperCase()}"`,
    `"BẢNG KÊ CHI TIẾT GIAO DỊCH THU CHI MINH BẠCH"`,
    `"Ngày xuất: ${dateStr}","Tổng số GD: ${transactions.length}","Tổng Thu: +${totalIncome}","Tổng Chi: -${totalExpense}","Chênh lệch: ${totalIncome - totalExpense}"`,
    `""` // Empty spacer
  ];

  const headers = [
    'STT',
    'Ngày giao dịch',
    'Phân loại',
    'Danh mục',
    'Lý do / Nội dung diễn giải',
    'Tiền Thu (+) VNĐ',
    'Tiền Chi (-) VNĐ',
    'Trạng thái'
  ];

  const rows = transactions.map((t, idx) => {
    const isIncome = t.type === 'income';
    const typeLabel = isIncome ? 'Thu (+)' : 'Chi (-)';
    const catName = catMap.get(t.categoryId) || 'Khác';
    const statusLabel = t.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý';
    const incomeVal = isIncome ? t.amount : '';
    const expenseVal = !isIncome ? t.amount : '';

    return [
      `"${idx + 1}"`,
      `"${t.date}"`,
      `"${typeLabel}"`,
      `"${catName.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${incomeVal}"`,
      `"${expenseVal}"`,
      `"${statusLabel}"`
    ].join(',');
  });

  // Summary row
  const summaryRow = `"TỔNG CỘNG","","","","","${totalIncome}","${totalExpense}",""`;
  const netRow = `"CHÊNH LỆCH RÒNG","","","","","${totalIncome - totalExpense}","",""`;

  const csvContent = '\uFEFF' + [...metaRows, headers.join(','), ...rows, summaryRow, netRow].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = fundName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  link.setAttribute('download', `Sao_ke_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // fallback below
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
