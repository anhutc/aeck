import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { TransactionType } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface FloatingTransactionButtonProps {
  onOpenTransactionModal: (type?: TransactionType) => void;
  isMemberView?: boolean;
  activeTab?: string;
}

export const FloatingTransactionButton: React.FC<FloatingTransactionButtonProps> = ({
  onOpenTransactionModal,
  isMemberView = false,
  activeTab,
}) => {
  const { t } = useTranslation();
  const { activePreset } = useTheme();
  // If member view (read-only) or on settings tab, do not render transaction creation button
  if (isMemberView || activeTab === 'settings') {
    return null;
  }

  // Keyboard shortcut support: '+' or '-' to open transaction modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onOpenTransactionModal('income');
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onOpenTransactionModal('expense');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenTransactionModal]);

  return (
    <div
      id="floating-thu-chi-widget"
      className="fixed z-40 right-3.5 sm:right-6 bottom-[72px] md:bottom-6 select-none pointer-events-auto"
    >
      <button
        id="floating-transaction-icon-btn"
        type="button"
        onClick={() => onOpenTransactionModal()}
        title={t('nav.floating_tx_title', 'Ghi nhận Thu / Chi mới [Phím tắt: + hoặc -]')}
        style={{ background: activePreset.gradient }}
        className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full text-white shadow-lg hover:shadow-xl border border-white/20 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
        aria-label={t('nav.floating_tx_aria', 'Thêm giao dịch thu chi')}
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
      </button>
    </div>
  );
};

