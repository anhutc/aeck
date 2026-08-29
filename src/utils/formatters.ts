import { BankSettings, Category, Fund, Transaction } from '../types';

export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
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

export function exportTransactionsToCSV(
  transactions: Transaction[],
  fundsOrCategories: (Fund | Category)[],
  categoriesOrFunds?: (Category | Fund)[]
): void {
  const allItems = [...(fundsOrCategories || []), ...(categoriesOrFunds || [])];
  const catMap = new Map<string, string>();
  allItems.forEach(item => {
    if (item && 'id' in item && 'name' in item) {
      catMap.set(item.id, item.name);
    }
  });

  const headers = [
    'STT',
    'Ngày giao dịch',
    'Phân loại',
    'Danh mục',
    'Lý do / Nội dung',
    'Số tiền (VNĐ)',
    'Trạng thái'
  ];

  const rows = transactions.map((t, idx) => {
    const typeLabel = t.type === 'income' ? 'Thu (+)' : 'Chi (-)';
    const catName = catMap.get(t.categoryId) || 'Khác';
    const statusLabel = t.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý';

    return [
      `"${idx + 1}"`,
      `"${t.date}"`,
      `"${typeLabel}"`,
      `"${catName.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.amount}"`,
      `"${statusLabel}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Sao_ke_so_quy_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
