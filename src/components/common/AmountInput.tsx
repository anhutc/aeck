import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, X, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { formatThousands, parseAmountInput, numberToVietnameseWords } from '../../utils/formatters';

export interface AmountInputProps {
  id?: string;
  value: number | string;
  onChange: (numericValue: number, formattedStr?: string) => void;
  type?: 'income' | 'expense' | 'neutral';
  label?: string;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  presets?: number[];
  showAdders?: boolean;
  showInWords?: boolean;
  showPresets?: boolean;
  className?: string;
}

const DEFAULT_PRESETS = [50000, 100000, 200000, 500000, 1000000, 2000000, 5000000];

export const AmountInput: React.FC<AmountInputProps> = ({
  id = 'amount-input',
  value,
  onChange,
  type = 'income',
  label,
  required = true,
  autoFocus = false,
  placeholder = 'VD: 500.000',
  max,
  presets = DEFAULT_PRESETS,
  showAdders = true,
  showInWords = true,
  showPresets = true,
  className = '',
}) => {
  const numericVal = typeof value === 'number' ? value : parseAmountInput(value);
  const [displayStr, setDisplayStr] = useState<string>(() => {
    return numericVal > 0 ? formatThousands(numericVal) : '';
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal display text when external value changes
  useEffect(() => {
    const parsed = typeof value === 'number' ? value : parseAmountInput(value);
    if (parsed > 0) {
      // Check if user was typing something that ends with a shortcut or partial
      const formatted = formatThousands(parsed);
      setDisplayStr(formatted);
    } else if (value === '' || value === 0) {
      setDisplayStr('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Allow empty string to reset
    if (!raw.trim()) {
      setDisplayStr('');
      onChange(0, '');
      return;
    }

    // Check if user typed shortcut like 50k, 500k, 1.5tr, 2tr5
    const parsed = parseAmountInput(raw);
    
    // If raw ends in 'k', 'tr', 't', 'm', 'ty' we parse and format immediately
    if (/[ktr|m|tỷ|ty]$/i.test(raw)) {
      if (parsed > 0) {
        setDisplayStr(formatThousands(parsed));
        onChange(parsed, formatThousands(parsed));
        return;
      }
    }

    // Normal numeric typing: keep thousands formatting live
    const digitsOnly = raw.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      setDisplayStr('');
      onChange(0, '');
      return;
    }

    const num = parseInt(digitsOnly, 10);
    if (max !== undefined && num > max) return;

    setDisplayStr(formatThousands(num));
    onChange(num, formatThousands(num));
  };

  const handleClear = () => {
    setDisplayStr('');
    onChange(0, '');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Multiply by 1,000 (adds '000')
  const handleMultiplyThousand = () => {
    const current = numericVal || 0;
    const next = current === 0 ? 1000 : current * 1000;
    if (max !== undefined && next > max) return;
    setDisplayStr(formatThousands(next));
    onChange(next, formatThousands(next));
    if (inputRef.current) inputRef.current.focus();
  };

  // Add an increment to current amount
  const handleAddAmount = (addValue: number) => {
    const current = numericVal || 0;
    const next = current + addValue;
    if (max !== undefined && next > max) return;
    setDisplayStr(formatThousands(next));
    onChange(next, formatThousands(next));
    if (inputRef.current) inputRef.current.focus();
  };

  // Select a preset directly
  const handleSelectPreset = (presetVal: number) => {
    setDisplayStr(formatThousands(presetVal));
    onChange(presetVal, formatThousands(presetVal));
    if (inputRef.current) inputRef.current.focus();
  };

  const isIncome = type === 'income';
  const isExpense = type === 'expense';

  const themeClasses = isIncome
    ? {
        border: 'border-emerald-300 dark:border-emerald-800/80',
        focus: 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
        bg: 'bg-emerald-50/20 dark:bg-emerald-950/15',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60',
        badgeText: 'text-emerald-800 dark:text-emerald-200',
      }
    : isExpense
    ? {
        border: 'border-rose-300 dark:border-rose-800/80',
        focus: 'focus:ring-2 focus:ring-rose-500 focus:border-rose-500',
        bg: 'bg-rose-50/20 dark:bg-rose-950/15',
        text: 'text-rose-700 dark:text-rose-300',
        icon: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60',
        badgeText: 'text-rose-800 dark:text-rose-200',
      }
    : {
        border: 'border-slate-300 dark:border-slate-700',
        focus: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        bg: 'bg-slate-50/50 dark:bg-slate-800/40',
        text: 'text-slate-900 dark:text-white',
        icon: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
        badgeText: 'text-blue-800 dark:text-blue-200',
      };

  const wordsText = numericVal > 0 ? numberToVietnameseWords(numericVal) : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Quick Note */}
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            {isIncome ? (
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            ) : isExpense ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Gõ nhanh: 50k, 500k, 1.5tr
          </span>
        </div>
      )}

      {/* Main Formatted Input Field */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required={required}
          autoFocus={autoFocus}
          value={displayStr}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-4 pr-16 py-2.5 sm:py-3 rounded-2xl border text-slate-900 dark:text-white font-black text-xl sm:text-2xl tracking-tight focus:outline-hidden transition-all shadow-xs ${themeClasses.border} ${themeClasses.focus} ${themeClasses.bg}`}
        />

        {/* Action icons right inside input */}
        <div className="absolute right-3.5 flex items-center gap-1.5">
          {displayStr && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Xóa nhanh số tiền"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 select-none">
            VNĐ
          </span>
        </div>
      </div>

      {/* Amount in Vietnamese Words ("Bằng chữ") */}
      {showInWords && (
        <div className="min-h-[22px] flex items-center">
          {numericVal > 0 ? (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${themeClasses.badgeBg} ${themeClasses.badgeText} animate-in fade-in duration-150`}>
              <span className="opacity-75 font-normal">Bằng chữ:</span>
              <span className="font-bold">{wordsText}</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-1">
              Số tiền tự động định dạng hàng nghìn và dịch thành chữ.
            </p>
          )}
        </div>
      )}

      {/* Quick Adders & Multiplier Row (+000, +50k, +100k, +500k, +1tr) */}
      {showAdders && (
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-0.5">
            Cộng:
          </span>

          {/* Special '+000' (nhân 1.000) */}
          <button
            type="button"
            onClick={handleMultiplyThousand}
            title="Nhân 1.000 (thêm 3 số 0)"
            className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
          >
            +000 (nghìn)
          </button>

          <button
            type="button"
            onClick={() => handleAddAmount(50000)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            +50k
          </button>

          <button
            type="button"
            onClick={() => handleAddAmount(100000)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            +100k
          </button>

          <button
            type="button"
            onClick={() => handleAddAmount(200000)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            +200k
          </button>

          <button
            type="button"
            onClick={() => handleAddAmount(500000)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            +500k
          </button>

          <button
            type="button"
            onClick={() => handleAddAmount(1000000)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            +1Tr
          </button>
        </div>
      )}

      {/* Preset Amount Chips (Mốc chọn sẵn) */}
      {showPresets && presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider self-center mr-0.5">
            Mốc:
          </span>
          {presets.map((val) => {
            const isSelected = numericVal === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleSelectPreset(val)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? isIncome
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isExpense
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {val >= 1000000 ? `${val / 1000000} Tr` : `${val / 1000} K`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
