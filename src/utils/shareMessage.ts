import { AppBranding, BankSettings, ContributionCampaign } from '../types';
import { formatVND, formatDate } from './formatters';

export interface BuildShareMessageOptions {
  appName: string;
  shareUrl: string;
  branding?: AppBranding;
  bankSettings?: BankSettings;
  activeCampaigns?: ContributionCampaign[];
  includeBank?: boolean;
  includeCampaigns?: boolean;
  includeBenefits?: boolean;
  customTemplate?: string;
}

export function generateZaloShareMessage(options: BuildShareMessageOptions): string {
  const {
    appName,
    shareUrl,
    branding,
    bankSettings,
    activeCampaigns = [],
    includeBank = branding?.shareMessageIncludeBank !== false,
    includeCampaigns = branding?.shareMessageIncludeCampaigns !== false,
    includeBenefits = true,
    customTemplate = branding?.socialShareTemplate,
  } = options;

  const cleanName = appName || branding?.appTitle || 'Sổ Quỹ Nhóm';
  const prefix = (branding?.transferSyntaxPrefix || 'DONG QUY').trim();

  // 1. Build bank info block
  let bankBlock = '';
  if (bankSettings?.accountNumber) {
    bankBlock = `🏦 THÔNG TIN CHUYỂN KHOẢN ĐÓNG QUỸ:\n` +
      `• Ngân hàng: ${bankSettings.bankName}${bankSettings.bankId ? ` (${bankSettings.bankId})` : ''}\n` +
      `• Số tài khoản: ${bankSettings.accountNumber}\n` +
      `• Chủ tài khoản: ${bankSettings.accountName.toUpperCase()}\n` +
      `• Cú pháp CK: [HỌ TÊN] ${prefix}`;
  }

  // 2. Build campaigns block
  let campaignsBlock = '';
  if (activeCampaigns.length > 0) {
    campaignsBlock = `🎯 CÁC ĐỢT THU QUỸ ĐANG DIỄN RA:\n` +
      activeCampaigns
        .map((c, i) => {
          const dueStr = c.dueDate ? ` (Hạn: ${formatDate(c.dueDate)})` : '';
          return `${i + 1}. ${c.title}: ${formatVND(c.amountPerMember)}/người${dueStr}`;
        })
        .join('\n');
  }

  // If a custom template is defined and non-empty, render it with placeholders
  if (customTemplate && customTemplate.trim()) {
    return customTemplate
      .replace(/\{appName\}/g, cleanName)
      .replace(/\{shareUrl\}/g, shareUrl)
      .replace(/\{bankName\}/g, bankSettings?.bankName || '')
      .replace(/\{accountNumber\}/g, bankSettings?.accountNumber || '')
      .replace(/\{accountName\}/g, bankSettings?.accountName || '')
      .replace(/\{syntaxPrefix\}/g, prefix)
      .replace(/\{bankInfo\}/g, bankBlock)
      .replace(/\{campaigns\}/g, campaignsBlock)
      .replace(/\{treasurerName\}/g, branding?.treasurerName || '')
      .replace(/\{treasurerPhone\}/g, branding?.treasurerPhone || '')
      .replace(/\{greeting\}/g, branding?.shareMessageGreeting || '')
      .replace(/\{closing\}/g, branding?.shareMessageClosing || '');
  }

  // Default structured announcement
  const greeting = branding?.shareMessageGreeting?.trim() ||
    `Kính gửi các thành viên,\nĐể đảm bảo tính công khai & minh bạch tài chính, mọi người có thể xem số dư quỹ, sao kê thu chi và tiến độ đóng góp qua liên kết dưới đây:`;

  const benefit1 = branding?.shareMessageBenefit1?.trim() || 'Xem số dư tồn quỹ & tiến độ các đợt đóng góp theo thời gian thực';
  const benefit2 = branding?.shareMessageBenefit2?.trim() || 'Quét mã VietQR chuyển khoản nhanh đúng cú pháp và tự động';
  const benefit3 = branding?.shareMessageBenefit3?.trim() || 'Xem chi tiết từng khoản thu và hóa đơn chứng từ chi tiêu minh bạch';
  const closing = branding?.shareMessageClosing?.trim() || 'Trân trọng cảm ơn sự gắn kết và đồng hành của mọi người!';

  const sections: string[] = [];

  // Header & Title
  sections.push(`📢 CỔNG THÔNG TIN ${cleanName.toUpperCase()} MINH BẠCH`);

  // Greeting
  if (greeting) {
    sections.push(greeting);
  }

  // Direct clean share link
  sections.push(`🔗 Link xem trực tuyến:\n${shareUrl}`);

  // Bank transfer info
  if (includeBank && bankBlock) {
    sections.push(bankBlock);
  }

  // Active campaigns
  if (includeCampaigns && campaignsBlock) {
    sections.push(campaignsBlock);
  }

  // Portal features / benefits
  if (includeBenefits) {
    sections.push(
      `✨ TIỆN ÍCH TRÊN HỆ THỐNG:\n` +
      `• ${benefit1}\n` +
      `• ${benefit2}\n` +
      `• ${benefit3}`
    );
  }

  // Closing & Treasurer Contact
  let closingSection = closing;
  if (branding?.treasurerName) {
    closingSection += `\n👤 Thủ quỹ: ${branding.treasurerName}${branding.treasurerPhone ? ` (📞 ${branding.treasurerPhone})` : ''}`;
  }
  if (closingSection) {
    sections.push(closingSection);
  }

  return sections.join('\n\n');
}
