import ExcelJS from 'exceljs';
import { Category, Fund, Transaction } from '../types';

// Helper to format currency for canvas rendering
function formatCompactVND(amount: number): string {
  if (!amount || isNaN(amount)) return '0';
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr';
  }
  if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(0) + ' k';
  }
  return amount.toLocaleString('vi-VN');
}

function formatFullVND(amount: number): string {
  return (amount || 0).toLocaleString('vi-VN') + ' ₫';
}

const PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#64748B'  // Slate
];

/**
 * Renders a Bar Chart comparing Monthly Income vs. Expense onto an offscreen canvas
 * Returns Base64 PNG data URL
 */
function createMonthlyBarChartImage(
  monthlyData: { month: string; income: number; expense: number }[],
  width = 620,
  height = 320
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const dpr = 2; // High DPI for crisp rendering in Excel
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);

  // Background Card
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Card Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Title
  ctx.font = 'bold 13px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('BIỂU ĐỒ SO SÁNH THU - CHI THEO THÁNG', 20, 26);

  ctx.font = '10px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('(Đơn vị: VNĐ)', 20, 42);

  // Legend
  const legendX = width - 180;
  // Income Legend
  ctx.fillStyle = '#10B981';
  ctx.fillRect(legendX, 18, 12, 12);
  ctx.fillStyle = '#334155';
  ctx.font = '11px "Segoe UI", Calibri, sans-serif';
  ctx.fillText('Thu (+)', legendX + 18, 28);

  // Expense Legend
  ctx.fillStyle = '#F43F5E';
  ctx.fillRect(legendX + 75, 18, 12, 12);
  ctx.fillStyle = '#334155';
  ctx.fillText('Chi (-)', legendX + 93, 28);

  if (monthlyData.length === 0) {
    ctx.font = 'italic 12px "Segoe UI", Calibri, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('Chưa có dữ liệu tháng để hiển thị biểu đồ', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  // Plot Area
  const plotLeft = 65;
  const plotRight = width - 25;
  const plotTop = 60;
  const plotBottom = height - 45;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  // Find max value for Y-axis scale
  let maxVal = 0;
  monthlyData.forEach(d => {
    if (d.income > maxVal) maxVal = d.income;
    if (d.expense > maxVal) maxVal = d.expense;
  });
  if (maxVal === 0) maxVal = 1000000;
  // Round up maxVal to a nice ceiling
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  maxVal = Math.ceil((maxVal * 1.15) / mag) * mag;

  // Draw Horizontal Gridlines & Y-labels
  const gridSteps = 4;
  ctx.font = '10px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'right';
  ctx.lineWidth = 1;

  for (let i = 0; i <= gridSteps; i++) {
    const yVal = (maxVal / gridSteps) * i;
    const yPos = plotBottom - (plotHeight / gridSteps) * i;

    // Gridline
    ctx.strokeStyle = i === 0 ? '#CBD5E1' : '#F1F5F9';
    ctx.beginPath();
    ctx.moveTo(plotLeft, yPos);
    ctx.lineTo(plotRight, yPos);
    ctx.stroke();

    // Label
    ctx.fillText(formatCompactVND(yVal), plotLeft - 8, yPos + 3);
  }

  // Draw Bars
  const count = monthlyData.length;
  const groupWidth = plotWidth / count;
  const barWidth = Math.min(26, (groupWidth - 16) / 2);

  monthlyData.forEach((d, idx) => {
    const groupCenterX = plotLeft + idx * groupWidth + groupWidth / 2;

    const incHeight = (d.income / maxVal) * plotHeight;
    const expHeight = (d.expense / maxVal) * plotHeight;

    const incX = groupCenterX - barWidth - 2;
    const expX = groupCenterX + 2;

    const incY = plotBottom - incHeight;
    const expY = plotBottom - expHeight;

    // Income Bar (Emerald)
    if (d.income > 0) {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(incX, incY, barWidth, incHeight, [3, 3, 0, 0]);
      } else {
        ctx.rect(incX, incY, barWidth, incHeight);
      }
      ctx.fill();

      // Top value
      ctx.font = 'bold 9px "Segoe UI", Calibri, sans-serif';
      ctx.fillStyle = '#065F46';
      ctx.textAlign = 'center';
      ctx.fillText(formatCompactVND(d.income), incX + barWidth / 2, Math.max(plotTop + 10, incY - 4));
    }

    // Expense Bar (Rose)
    if (d.expense > 0) {
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(expX, expY, barWidth, expHeight, [3, 3, 0, 0]);
      } else {
        ctx.rect(expX, expY, barWidth, expHeight);
      }
      ctx.fill();

      // Top value
      ctx.font = 'bold 9px "Segoe UI", Calibri, sans-serif';
      ctx.fillStyle = '#9F1239';
      ctx.textAlign = 'center';
      ctx.fillText(formatCompactVND(d.expense), expX + barWidth / 2, Math.max(plotTop + 10, expY - 4));
    }

    // X-axis label
    ctx.font = '10px "Segoe UI", Calibri, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(d.month, groupCenterX, plotBottom + 18);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Renders a Donut Chart for Expense by Category onto an offscreen canvas
 * Returns Base64 PNG data URL
 */
function createCategoryDonutChartImage(
  categoryBreakdown: { name: string; amount: number; percentage: number }[],
  totalExpense: number,
  title = 'CƠ CẤU CHI TIÊU THEO DANH MỤC',
  width = 620,
  height = 320
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const dpr = 2;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);

  // Background Card
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Card Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Title
  ctx.font = 'bold 13px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'left';
  ctx.fillText(title, 20, 26);

  ctx.font = '10px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(`Tổng cộng: ${formatFullVND(totalExpense)}`, 20, 42);

  if (categoryBreakdown.length === 0 || totalExpense === 0) {
    ctx.font = 'italic 12px "Segoe UI", Calibri, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('Chưa có chi tiêu phát sinh để phân tích', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }

  // Donut geometry
  const centerX = 160;
  const centerY = height / 2 + 15;
  const outerRadius = 90;
  const innerRadius = 54;

  let currentAngle = -Math.PI / 2;

  categoryBreakdown.forEach((item, idx) => {
    const sliceAngle = (item.amount / totalExpense) * 2 * Math.PI;
    const color = PALETTE[idx % PALETTE.length];

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Inner circle text
  ctx.font = 'bold 10px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'center';
  ctx.fillText('TỔNG CHI', centerX, centerY - 6);

  ctx.font = 'bold 12px "Segoe UI", Calibri, sans-serif';
  ctx.fillStyle = '#1E293B';
  ctx.fillText(formatCompactVND(totalExpense), centerX, centerY + 12);

  // Legend on the Right
  const legendX = 310;
  const legendStartY = 60;
  const lineHeight = 24;
  const maxLegendItems = 9;

  ctx.textAlign = 'left';
  const displayItems = categoryBreakdown.slice(0, maxLegendItems);

  displayItems.forEach((item, idx) => {
    const y = legendStartY + idx * lineHeight;
    const color = PALETTE[idx % PALETTE.length];

    // Color Box
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(legendX, y - 9, 11, 11, [2, 2, 2, 2]);
    } else {
      ctx.rect(legendX, y - 9, 11, 11);
    }
    ctx.fill();

    // Category Name (Truncated if too long)
    ctx.font = 'bold 11px "Segoe UI", Calibri, sans-serif';
    ctx.fillStyle = '#334155';
    let label = item.name;
    if (label.length > 18) label = label.slice(0, 16) + '...';
    ctx.fillText(label, legendX + 18, y);

    // Percentage & Amount
    ctx.font = '10px "Segoe UI", Calibri, sans-serif';
    ctx.fillStyle = '#64748B';
    const detailText = `${formatCompactVND(item.amount)} (${item.percentage.toFixed(1)}%)`;
    ctx.fillText(detailText, legendX + 160, y);
  });

  if (categoryBreakdown.length > maxLegendItems) {
    const remainingCount = categoryBreakdown.length - maxLegendItems;
    ctx.font = 'italic 10px "Segoe UI", Calibri, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`...và ${remainingCount} danh mục khác`, legendX + 18, legendStartY + maxLegendItems * lineHeight);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Main export function: Exports a 2-sheet Excel Workbook with Charts & Analytics
 */
export async function exportTransactionsToExcelWithAnalytics(
  transactions: Transaction[],
  fundsOrCategories: (Fund | Category)[],
  categoriesOrFunds?: (Category | Fund)[],
  customFundName?: string
): Promise<void> {
  const allItems = [...(fundsOrCategories || []), ...(categoriesOrFunds || [])];
  const catMap = new Map<string, string>();
  allItems.forEach(item => {
    if (item && 'id' in item && 'name' in item) {
      catMap.set(item.id, item.name);
    }
  });

  const fundItem = (fundsOrCategories || []).find(f => f && 'balance' in f) as Fund | undefined;
  const fundName = customFundName?.trim() || fundItem?.name?.trim() || 'AE Cây Khế';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = fundName;
  workbook.lastModifiedBy = fundName;
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Calculate General Financial KPIs
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeTxCount = 0;
  let expenseTxCount = 0;

  const expenseByCatMap = new Map<string, { name: string; amount: number; count: number }>();
  const incomeByCatMap = new Map<string, { name: string; amount: number; count: number }>();
  const monthlyMap = new Map<string, { month: string; income: number; expense: number }>();

  transactions.forEach(t => {
    const isCompleted = t.status === 'completed';
    const catName = catMap.get(t.categoryId) || 'Khác';

    // Parse Month (YYYY-MM or YYYY/MM)
    let monthKey = 'Chung';
    if (t.date && t.date.length >= 7) {
      monthKey = t.date.slice(0, 7); // "2025-05"
    }

    if (!monthlyMap.has(monthKey)) {
      const parts = monthKey.split('-');
      const formattedMonth = parts.length === 2 ? `T${parts[1]}/${parts[0].slice(2)}` : monthKey;
      monthlyMap.set(monthKey, { month: formattedMonth, income: 0, expense: 0 });
    }

    const monthObj = monthlyMap.get(monthKey)!;

    if (t.type === 'income') {
      if (isCompleted) {
        totalIncome += t.amount;
        monthObj.income += t.amount;
      }
      incomeTxCount++;
      const cur = incomeByCatMap.get(catName) || { name: catName, amount: 0, count: 0 };
      if (isCompleted) cur.amount += t.amount;
      cur.count++;
      incomeByCatMap.set(catName, cur);
    } else {
      if (isCompleted) {
        totalExpense += t.amount;
        monthObj.expense += t.amount;
      }
      expenseTxCount++;
      const cur = expenseByCatMap.get(catName) || { name: catName, amount: 0, count: 0 };
      if (isCompleted) cur.amount += t.amount;
      cur.count++;
      expenseByCatMap.set(catName, cur);
    }
  });

  const netBalance = totalIncome - totalExpense;
  const avgExpense = expenseTxCount > 0 ? totalExpense / expenseTxCount : 0;
  const expenseToIncomeRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Prepare sorted lists
  const expenseCatList = Array.from(expenseByCatMap.values())
    .map(c => ({
      ...c,
      percentage: totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const incomeCatList = Array.from(incomeByCatMap.values())
    .map(c => ({
      ...c,
      percentage: totalIncome > 0 ? (c.amount / totalIncome) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyList = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(entry => entry[1]);

  // =========================================================================
  // SHEET 1: 📊 BÁO CÁO & BIỂU ĐỒ (DASHBOARD & ANALYTICS)
  // =========================================================================
  const ws1 = workbook.addWorksheet('📊 Báo Cáo & Biểu Đồ', {
    views: [{ showGridLines: true }]
  });

  // Set column widths for Dashboard
  ws1.columns = [
    { key: 'A', width: 6 },
    { key: 'B', width: 22 },
    { key: 'C', width: 14 },
    { key: 'D', width: 18 },
    { key: 'E', width: 14 },
    { key: 'F', width: 18 },
    { key: 'G', width: 18 },
    { key: 'H', width: 16 }
  ];

  // 1. Header Banner
  ws1.mergeCells('A1:H1');
  const ws1Title = ws1.getCell('A1');
  ws1Title.value = `BÁO CÁO PHÂN TÍCH TÀI CHÍNH & BIỂU ĐỒ - ${fundName.toUpperCase()}`;
  ws1Title.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
  ws1Title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 34;

  // 2. Subtitle
  ws1.mergeCells('A2:H2');
  const ws1Sub = ws1.getCell('A2');
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  ws1Sub.value = `Thời gian trích xuất: ${dateStr}  •  Dữ liệu tổng hợp tự động từ phần mềm quản trị quỹ`;
  ws1Sub.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  ws1Sub.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(2).height = 18;

  ws1.getRow(3).height = 10; // Spacer

  // 3. KPI Header Row (Row 4)
  ws1.mergeCells('A4:B4');
  ws1.getCell('A4').value = 'TỔNG THU (+)';
  ws1.mergeCells('C4:D4');
  ws1.getCell('C4').value = 'TỔNG CHI (-)';
  ws1.mergeCells('E4:F4');
  ws1.getCell('E4').value = 'DÒNG TIỀN RÒNG';
  ws1.getCell('G4').value = 'TỶ LỆ CHI / THU';
  ws1.getCell('H4').value = 'TỔNG GIAO DỊCH';

  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4'].forEach(p => {
    const c = ws1.getCell(p);
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF64748B' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });
  ws1.getRow(4).height = 20;

  // 4. KPI Values Row (Row 5)
  ws1.mergeCells('A5:B5');
  const kpiInc = ws1.getCell('A5');
  kpiInc.value = totalIncome;
  kpiInc.numFmt = '#,##0 "₫"';
  kpiInc.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF047857' } };

  ws1.mergeCells('C5:D5');
  const kpiExp = ws1.getCell('C5');
  kpiExp.value = totalExpense;
  kpiExp.numFmt = '#,##0 "₫"';
  kpiExp.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFB91C1C' } };

  ws1.mergeCells('E5:F5');
  const kpiNet = ws1.getCell('E5');
  kpiNet.value = netBalance;
  kpiNet.numFmt = '#,##0 "₫"';
  kpiNet.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1E40AF' } };

  const kpiRatio = ws1.getCell('G5');
  kpiRatio.value = totalIncome > 0 ? expenseToIncomeRatio / 100 : 0;
  kpiRatio.numFmt = '0.0%';
  kpiRatio.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF334155' } };

  const kpiCount = ws1.getCell('H5');
  kpiCount.value = transactions.length;
  kpiCount.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF334155' } };

  ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5'].forEach(p => {
    const c = ws1.getCell(p);
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    c.border = {
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });
  ws1.getRow(5).height = 32;

  ws1.getRow(6).height = 12; // Spacer

  // 5. Generate and Insert Chart Images
  try {
    const barChartDataUrl = createMonthlyBarChartImage(monthlyList, 520, 270);
    if (barChartDataUrl) {
      const cleanBase64 = barChartDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const barImageId = workbook.addImage({ base64: cleanBase64, extension: 'png' });
      ws1.addImage(barImageId, {
        tl: { col: 0, row: 6 },
        ext: { width: 510, height: 265 }
      });
    }

    const donutChartDataUrl = createCategoryDonutChartImage(expenseCatList, totalExpense, 'CƠ CẤU CHI TIÊU THEO DANH MỤC', 520, 270);
    if (donutChartDataUrl) {
      const cleanBase64 = donutChartDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const donutImageId = workbook.addImage({ base64: cleanBase64, extension: 'png' });
      ws1.addImage(donutImageId, {
        tl: { col: 4, row: 6 },
        ext: { width: 510, height: 265 }
      });
    }
  } catch (err) {
    console.error('Không thể vẽ hình ảnh biểu đồ vào Excel:', err);
  }

  // Fast forward rows down to row 22 to leave space for charts (rows 7 to 20)
  for (let r = 7; r <= 20; r++) {
    ws1.getRow(r).height = 19;
  }
  ws1.getRow(21).height = 14;

  // 6. Table 1: Expense by Category Breakdown (Row 22)
  let curRow = 22;
  ws1.mergeCells(`A${curRow}:E${curRow}`);
  const t1Title = ws1.getCell(`A${curRow}`);
  t1Title.value = '1. PHÂN TÍCH CHI TIẾT CƠ CẤU CHI TIÊU THEO DANH MỤC';
  t1Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF991B1B' } };
  t1Title.alignment = { vertical: 'middle' };
  ws1.getRow(curRow).height = 24;
  curRow++;

  const expHeaderRow = ws1.getRow(curRow);
  expHeaderRow.height = 24;
  expHeaderRow.values = ['STT', 'Tên Danh Mục Chi', 'Số Món', 'Tổng Tiền Chi', 'Tỷ Trọng %'];
  expHeaderRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } };
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: col === 2 ? 'left' : (col === 4 ? 'right' : 'center') };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  curRow++;

  const expDataStartRow = curRow;
  expenseCatList.forEach((cat, idx) => {
    const row = ws1.getRow(curRow);
    row.height = 20;
    row.values = [
      idx + 1,
      cat.name,
      cat.count,
      cat.amount,
      cat.percentage / 100
    ];

    row.eachCell((c, col) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } };
      c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      c.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };

      if (col === 1) c.alignment = { horizontal: 'center', vertical: 'middle' };
      if (col === 2) {
        c.alignment = { horizontal: 'left', vertical: 'middle' };
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      }
      if (col === 3) c.alignment = { horizontal: 'center', vertical: 'middle' };
      if (col === 4) {
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '#,##0 "₫"';
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
      }
      if (col === 5) {
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '0.0%';
      }
    });
    curRow++;
  });

  // Total Expense Category Summary Row
  const expTotalRow = ws1.getRow(curRow);
  expTotalRow.height = 24;
  ws1.mergeCells(`A${curRow}:B${curRow}`);
  ws1.getCell(`A${curRow}`).value = 'TỔNG CỘNG CHI TIÊU:';
  ws1.getCell(`A${curRow}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
  ws1.getCell(`A${curRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

  ws1.getCell(`C${curRow}`).value = expenseTxCount;
  ws1.getCell(`C${curRow}`).font = { name: 'Calibri', size: 10, bold: true };
  ws1.getCell(`C${curRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

  const sumExpCell = ws1.getCell(`D${curRow}`);
  if (expenseCatList.length > 0) {
    sumExpCell.value = { formula: `SUM(D${expDataStartRow}:D${curRow - 1})`, result: totalExpense };
  } else {
    sumExpCell.value = 0;
  }
  sumExpCell.numFmt = '#,##0 "₫"';
  sumExpCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
  sumExpCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const sumExpPctCell = ws1.getCell(`E${curRow}`);
  sumExpPctCell.value = expenseCatList.length > 0 ? 1 : 0;
  sumExpPctCell.numFmt = '0.0%';
  sumExpPctCell.font = { name: 'Calibri', size: 10, bold: true };
  sumExpPctCell.alignment = { horizontal: 'right', vertical: 'middle' };

  ['A', 'B', 'C', 'D', 'E'].forEach(col => {
    const c = ws1.getCell(`${col}${curRow}`);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    c.border = { top: { style: 'medium', color: { argb: 'FF991B1B' } }, bottom: { style: 'double', color: { argb: 'FF991B1B' } } };
  });
  curRow += 2; // Spacer

  // 7. Table 2: Monthly Cash Flow Summary (Row curRow)
  ws1.mergeCells(`A${curRow}:G${curRow}`);
  const t2Title = ws1.getCell(`A${curRow}`);
  t2Title.value = '2. DIỄN BIẾN DÒNG TIỀN THEO TỪNG THÁNG (CASH FLOW)';
  t2Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
  t2Title.alignment = { vertical: 'middle' };
  ws1.getRow(curRow).height = 24;
  curRow++;

  const monthHeaderRow = ws1.getRow(curRow);
  monthHeaderRow.height = 24;
  monthHeaderRow.values = ['STT', 'Kỳ Tháng', 'Tổng Thu (+)', 'Tổng Chi (-)', 'Chênh Lệch Ròng', 'Tỷ Lệ Chi/Thu', 'Trạng Thái'];
  monthHeaderRow.eachCell((c, col) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: col === 2 ? 'left' : (col >= 3 && col <= 5 ? 'right' : 'center') };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  curRow++;

  monthlyList.forEach((m, idx) => {
    const row = ws1.getRow(curRow);
    row.height = 20;
    const net = m.income - m.expense;
    const ratio = m.income > 0 ? m.expense / m.income : 0;
    const status = net >= 0 ? 'Thặng dư (+)' : 'Thâm hụt (-)';

    row.values = [
      idx + 1,
      m.month,
      m.income,
      m.expense,
      net,
      ratio,
      status
    ];

    row.eachCell((c, col) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' } };
      c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      c.font = { name: 'Calibri', size: 10 };

      if (col === 1) c.alignment = { horizontal: 'center', vertical: 'middle' };
      if (col === 2) {
        c.alignment = { horizontal: 'left', vertical: 'middle' };
        c.font = { name: 'Calibri', size: 10, bold: true };
      }
      if (col === 3) {
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '#,##0 "₫"';
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
      }
      if (col === 4) {
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '#,##0 "₫"';
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
      }
      if (col === 5) {
        c.alignment = { horizontal: 'right', vertical: 'middle' };
        c.numFmt = '#,##0 "₫"';
        c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: net >= 0 ? 'FF1E40AF' : 'FFDC2626' } };
      }
      if (col === 6) {
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.numFmt = '0.0%';
      }
      if (col === 7) {
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: net >= 0 ? 'FF059669' : 'FFDC2626' } };
      }
    });
    curRow++;
  });

  curRow += 2; // Footer spacer
  ws1.mergeCells(`A${curRow}:G${curRow}`);
  ws1.getCell(`A${curRow}`).value = `* Bảng phân tích được khởi tạo tự động. Vui lòng bấm sang trang "📝 Chi Tiết Sổ Quỹ" để xem toàn bộ danh sách từng dòng giao dịch.`;
  ws1.getCell(`A${curRow}`).font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF94A3B8' } };


  // =========================================================================
  // SHEET 2: 📝 CHI TIẾT SỔ QUỸ (TRANSACTIONS LOG)
  // =========================================================================
  const ws2 = workbook.addWorksheet('📝 Chi Tiết Sổ Quỹ', {
    views: [{ showGridLines: true }],
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // Set column widths
  ws2.columns = [
    { key: 'stt', width: 7 },
    { key: 'date', width: 14 },
    { key: 'type', width: 13 },
    { key: 'category', width: 20 },
    { key: 'description', width: 44 },
    { key: 'income', width: 18 },
    { key: 'expense', width: 18 },
    { key: 'status', width: 15 }
  ];

  // Title Banner
  ws2.mergeCells('A1:H1');
  const ws2Title = ws2.getCell('A1');
  ws2Title.value = `SỔ QUỸ THU CHI - ${fundName.toUpperCase()}`;
  ws2Title.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF1E3A8A' } };
  ws2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getRow(1).height = 30;

  // Subtitle
  ws2.mergeCells('A2:H2');
  const ws2Sub = ws2.getCell('A2');
  ws2Sub.value = `BẢNG KÊ CHI TIẾT TOÀN BỘ GIAO DỊCH (${transactions.length} mục) • Xuất lúc ${dateStr}`;
  ws2Sub.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  ws2Sub.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getRow(2).height = 18;

  ws2.getRow(3).height = 8; // Spacer

  // Summary Row on Sheet 2
  ws2.mergeCells('A4:B4');
  ws2.getCell('A4').value = 'TỔNG THU:';
  ws2.getCell('A4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
  ws2.getCell('A4').alignment = { horizontal: 'right', vertical: 'middle' };

  ws2.getCell('C4').value = totalIncome;
  ws2.getCell('C4').numFmt = '#,##0 "₫"';
  ws2.getCell('C4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };

  ws2.mergeCells('D4:E4');
  ws2.getCell('D4').value = 'TỔNG CHI:';
  ws2.getCell('D4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF991B1B' } };
  ws2.getCell('D4').alignment = { horizontal: 'right', vertical: 'middle' };

  ws2.getCell('F4').value = totalExpense;
  ws2.getCell('F4').numFmt = '#,##0 "₫"';
  ws2.getCell('F4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };

  ws2.getCell('G4').value = 'TỒN RÒNG:';
  ws2.getCell('G4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
  ws2.getCell('G4').alignment = { horizontal: 'right', vertical: 'middle' };

  ws2.getCell('H4').value = netBalance;
  ws2.getCell('H4').numFmt = '#,##0 "₫"';
  ws2.getCell('H4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E40AF' } };

  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4'].forEach(pos => {
    const c = ws2.getCell(pos);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
  });
  ws2.getRow(4).height = 22;

  ws2.getRow(5).height = 8; // Spacer

  // Header Row (Row 6)
  const txHeaderRow = ws2.getRow(6);
  txHeaderRow.height = 26;
  txHeaderRow.values = [
    'STT',
    'Ngày GD',
    'Phân loại',
    'Danh mục',
    'Lý do / Nội dung diễn giải',
    'Tiền Thu (+)',
    'Tiền Chi (-)',
    'Trạng thái'
  ];

  txHeaderRow.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber === 5 ? 'left' : (colNumber === 6 || colNumber === 7 ? 'right' : 'center'),
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } }
    };
  });

  // Data Rows
  const startTxRow = 7;
  transactions.forEach((t, idx) => {
    const rowNum = startTxRow + idx;
    const row = ws2.getRow(rowNum);
    row.height = 21;

    const isIncome = t.type === 'income';
    const isCompleted = t.status === 'completed';
    const catName = catMap.get(t.categoryId) || 'Khác';

    let displayDate = t.date;
    if (t.date && t.date.includes('-')) {
      const parts = t.date.split('-');
      if (parts.length === 3) displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    row.values = [
      idx + 1,
      displayDate,
      isIncome ? 'Thu (+)' : 'Chi (-)',
      catName,
      t.description || '',
      isIncome ? t.amount : 0,
      !isIncome ? t.amount : 0,
      isCompleted ? 'Hoàn thành' : 'Chờ xử lý'
    ];

    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };

      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: isIncome ? 'FF047857' : 'FFB91C1C' }
        };
      } else if (colNumber === 4) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      } else if (colNumber === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0 "₫"';
        if (isIncome && t.amount > 0) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
        } else {
          cell.value = '-';
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
        }
      } else if (colNumber === 7) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0 "₫"';
        if (!isIncome && t.amount > 0) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
        } else {
          cell.value = '-';
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF94A3B8' } };
        }
      } else if (colNumber === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = {
          name: 'Calibri',
          size: 9,
          bold: true,
          color: { argb: isCompleted ? 'FF059669' : 'FFD97706' }
        };
      }
    });
  });

  // Total Summary Row on Sheet 2
  const totalTxRowNum = startTxRow + transactions.length;
  ws2.mergeCells(`A${totalTxRowNum}:E${totalTxRowNum}`);
  const sumLabelCell = ws2.getCell(`A${totalTxRowNum}`);
  sumLabelCell.value = 'TỔNG CỘNG PHÁT SINH:';
  sumLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  sumLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const sumIncomeCell = ws2.getCell(`F${totalTxRowNum}`);
  if (transactions.length > 0) {
    sumIncomeCell.value = { formula: `SUM(F${startTxRow}:F${totalTxRowNum - 1})`, result: totalIncome };
  } else {
    sumIncomeCell.value = 0;
  }
  sumIncomeCell.numFmt = '#,##0 "₫"';
  sumIncomeCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF047857' } };
  sumIncomeCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const sumExpenseCell = ws2.getCell(`G${totalTxRowNum}`);
  if (transactions.length > 0) {
    sumExpenseCell.value = { formula: `SUM(G${startTxRow}:G${totalTxRowNum - 1})`, result: totalExpense };
  } else {
    sumExpenseCell.value = 0;
  }
  sumExpenseCell.numFmt = '#,##0 "₫"';
  sumExpenseCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
  sumExpenseCell.alignment = { horizontal: 'right', vertical: 'middle' };

  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
    const c = ws2.getCell(`${col}${totalTxRowNum}`);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } }
    };
  });
  ws2.getRow(totalTxRowNum).height = 26;

  // Write and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = fundName.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  link.setAttribute('download', `Bao_cao_tai_chinh_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
