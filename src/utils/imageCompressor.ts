/**
 * Utility for compressing uploaded bill / invoice images before saving into Firestore/LocalStorage
 * Resizes images to max 1280px maintaining aspect ratio and encodes to JPEG at quality 0.78.
 * Typically reduces 3-10MB camera photos down to 80-160KB while keeping text razor-sharp.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

export async function compressBillImage(
  file: File,
  maxDimension = 1280,
  quality = 0.78
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Tệp tải lên không phải là định dạng hình ảnh hợp lệ (JPG, PNG, WebP).'));
    }

    const originalSizeKb = Math.round(file.size / 1024);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        if (targetWidth >= targetHeight) {
          targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
          targetWidth = maxDimension;
        } else {
          targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
          targetHeight = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Trình duyệt không hỗ trợ xử lý hình ảnh qua Canvas.'));
      }

      // Draw white background in case of transparent PNG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      // Rough base64 size calculation
      const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
      const compressedSizeKb = Math.round((stringLength * 3) / 4 / 1024);

      resolve({
        dataUrl,
        originalSizeKb,
        compressedSizeKb,
        width: targetWidth,
        height: targetHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể đọc dữ liệu hình ảnh. Vui lòng thử lại với ảnh khác.'));
    };

    img.src = objectUrl;
  });
}
