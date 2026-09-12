import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Receipt,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Transaction, Category } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';

interface BillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category?: Category;
}

export const BillViewModal: React.FC<BillViewModalProps> = ({
  isOpen,
  onClose,
  transaction,
  category,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset zoom and rotation whenever opening a new bill
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, transaction]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction || !transaction.billImage) return null;

  const isIncome = transaction.type === 'income';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transaction.billImage!;
    const sanitizedDesc = (transaction.description || 'bill')
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')
      .slice(0, 30);
    link.download = `bill_${transaction.date}_${sanitizedDesc}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div
      id="bill-view-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm transition-all animate-in fade-in duration-150"
    >
      <div
        id="bill-view-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-3xl overflow-hidden max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                isIncome ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>{isIncome ? 'Ảnh Chứng Từ Thu' : 'Ảnh Hóa Đơn / Bill Chi'}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    isIncome ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {isIncome ? '+' : '-'}{formatVND(transaction.amount)}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {transaction.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              title="Tải ảnh hóa đơn về máy"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Đóng"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transaction Summary Sub-bar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-800/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{formatDate(transaction.date)}</span>
            </span>
            {category && (
              <span className="flex items-center gap-1 text-slate-400">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>{category.name}</span>
              </span>
            )}
            <span className="flex items-center gap-1 font-mono font-semibold text-slate-200">
              {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />}
              <span>{isIncome ? 'Thu vào' : 'Chi tiêu'}</span>
            </span>
          </div>

          {/* Quick Zoom/Rotate Controls */}
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/60">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Thu nhỏ"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono w-10 text-center text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              title="Phóng to"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-700 mx-1" />
            <button
              onClick={handleRotate}
              title="Xoay ảnh 90°"
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              title="Kích thước ban đầu"
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bill Image Canvas Container */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex items-center justify-center min-h-[300px] sm:min-h-[420px] select-none">
          <div
            className="transition-transform duration-150 flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={transaction.billImage}
              alt={`Hóa đơn ${transaction.description}`}
              className="max-w-full max-h-[68vh] object-contain rounded-lg shadow-2xl border border-slate-800 pointer-events-auto"
              draggable={false}
            />
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between">
          <span className="truncate">
            Hóa đơn chứng từ minh bạch cho khoản {isIncome ? 'thu' : 'chi'}: <strong className="text-slate-200">{transaction.description}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer ml-2"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
