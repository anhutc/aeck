import React, { useState, useEffect } from "react";
import { X, QrCode, Building2, Copy, Check, Download, Share2 } from "lucide-react";
import { BankSettings, AppBranding } from "../../types";
import { formatVND, getVietQRUrl } from "../../utils/formatters";
import { AmountInput } from "../common/AmountInput";
import { useTranslation } from "../../i18n/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankSettings: BankSettings;
  defaultAmount?: number;
  defaultContent?: string;
  branding?: AppBranding;
  isAdmin?: boolean;
  isFromHeader?: boolean;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  bankSettings,
  defaultAmount = 0,
  branding,
  isAdmin = false,
  isFromHeader = false,
}) => {
  const { t } = useTranslation();
  const { activePreset } = useTheme();
  const [amount, setAmount] = useState<number | string>(
    isFromHeader ? "" : defaultAmount > 0 ? defaultAmount : ""
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync amount when modal opens or default props change
  useEffect(() => {
    if (isOpen) {
      if (isFromHeader) {
        setAmount("");
      } else {
        setAmount(defaultAmount > 0 ? defaultAmount : "");
      }
    }
  }, [isOpen, defaultAmount, isFromHeader]);

  if (!isOpen) return null;

  const numAmount = isFromHeader ? 0 : typeof amount === "number" ? amount : (parseFloat(amount) || 0);
  // Do not pass transfer content to VietQR to completely avoid transfer memo / syntax
  const qrUrl = getVietQRUrl(bankSettings, numAmount > 0 ? numAmount : undefined, undefined);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullShareText = () => {
    const header = branding?.qrShareHeader || t("vietqr.share_header", "THÔNG TIN CHUYỂN KHOẢN ĐÓNG QUỸ TẬP THỂ");
    const footer = branding?.qrShareFooter || t("vietqr.share_footer", "Trân trọng cảm ơn sự đồng hành và đóng góp của bạn! ✨");

    const lines: string[] = [
      `💰 ${header}`,
      `🏛️ ${t("settings.bank_label", "Ngân hàng")}: ${bankSettings.bankName}`,
      `🔢 ${t("settings.account_number_label", "Số tài khoản")}: ${bankSettings.accountNumber}`,
      `👤 ${t("settings.account_name_label", "Chủ tài khoản")}: ${bankSettings.accountName}`,
    ];

    if (numAmount > 0) {
      lines.push(`💵 ${t("settings.amount_label", "Số tiền")}: ${formatVND(numAmount)}`);
    }

    lines.push(`\n${footer}`);
    handleCopy(lines.join("\n"), "all");
  };

  const copyTransferInfo = () => {
    const lines: string[] = [
      `${t("settings.bank_label", "Ngân hàng")}: ${bankSettings.bankName}`,
      `${t("settings.account_number_label", "Số tài khoản")}: ${bankSettings.accountNumber}`,
      `${t("settings.account_name_label", "Chủ tài khoản")}: ${bankSettings.accountName}`,
    ];

    if (numAmount > 0) {
      lines.push(`${t("settings.amount_label", "Số tiền")}: ${formatVND(numAmount)}`);
    }

    handleCopy(lines.join("\n"), "transfer_info");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div 
              style={{ background: activePreset.gradient }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t("vietqr.title", "Mã QR Thu Quỹ")}
              </h2>
              <p className="text-xs text-slate-500">
                {t("vietqr.subtitle", "Quét mã VietQR chuyển khoản nhanh chính xác")}
              </p>
            </div>
          </div>
          <button 
            id="close-vietqr-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* QR Code Display Card */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 max-w-[220px] w-full flex items-center justify-center">
              <img
                id="vietqr-image"
                src={qrUrl}
                alt={t("vietqr.img_alt", "VietQR Chuyển Khoản")}
                className="w-full h-auto object-contain rounded-lg"
                loading="lazy"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              {t("vietqr.guide_note", "Mở ứng dụng ngân hàng (Vietcombank, MB, Techcombank, Momo...) để quét mã")}
            </p>
          </div>

          {/* Dynamic input controls for amount - hidden when opened from header */}
          {!isFromHeader && (
            <div className="space-y-3">
              <AmountInput
                id="qr-amount-input"
                value={amount}
                onChange={(val) => setAmount(val)}
                type="income"
                label={t("vietqr.amount_label", "Số tiền chỉ định (VNĐ)")}
                placeholder={t("vietqr.amount_placeholder", "Tự nhập khi quét hoặc nhập số...")}
                presets={[50000, 100000, 200000, 500000, 1000000]}
                showAdders
                showInWords
                showPresets
              />
            </div>
          )}

          {/* Bank details with 1-click copy */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">{t("settings.bank_label", "Ngân hàng")}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{bankSettings.bankName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{t("settings.account_number_label", "Số tài khoản")}:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm tracking-wider">
                  {bankSettings.accountNumber}
                </span>
              </div>
              <button
                id="copy-account-no-btn"
                onClick={() => handleCopy(bankSettings.accountNumber, "acc")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium text-[11px] flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
              >
                {copiedField === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === "acc" ? t("common.copied", "Đã chép") : t("vietqr.copy_acc_num", "Sao chép số TK")}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{t("settings.account_name_label", "Chủ tài khoản")}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                  {bankSettings.accountName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quick Share Buttons - Sticky & Non-clipping */}
        <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
          {isAdmin ? (
            <button
              id="copy-full-share-text-btn"
              onClick={copyFullShareText}
              style={{ background: activePreset.gradient, boxShadow: `0 4px 14px ${activePreset.primary}35` }}
              className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 active:scale-95"
            >
              {copiedField === "all" ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copiedField === "all" ? t("vietqr.copied_full_msg", "Đã sao chép toàn bộ lời nhắn!") : t("vietqr.copy_full_msg", "Sao chép tin nhắn")}
            </button>
          ) : (
            <button
              id="copy-transfer-info-btn"
              onClick={copyTransferInfo}
              style={{ background: activePreset.gradient, boxShadow: `0 4px 14px ${activePreset.primary}35` }}
              className="flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95 active:scale-95"
            >
              {copiedField === "transfer_info" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copiedField === "transfer_info"
                ? t("vietqr.copied_transfer_info", "Đã sao chép thông tin CK!")
                : t("vietqr.copy_transfer_info", "Sao chép thông tin chuyển khoản")}
            </button>
          )}

          <a
            id="download-qr-btn"
            href={qrUrl}
            target="_blank"
            rel="noreferrer"
            download="VietQR_NopQuy.png"
            className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t("vietqr.download_img", "Tải ảnh")}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
