import { BankSettings } from '../types';

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

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. First attempt: Synchronous document.execCommand('copy') while user gesture is 100% active.
  // This works reliably inside sandboxed iframes, Android Chrome, and mobile Safari.
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.fontSize = '16px'; // Prevent auto-zoom on iOS
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return true;
    }
  } catch (err) {
    // Continue to navigator.clipboard
  }

  // 2. Second attempt: Modern Navigator Clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard failed:', err);
  }

  return false;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo to Purple
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue to Cyan
  'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Emerald to Green
  'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', // Amber to Orange
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // Pink to Rose
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Violet to Pink
  'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', // Teal to Sky
  'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', // Indigo to Cyan
];

export function getAvatarGradient(name: string): string {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}
