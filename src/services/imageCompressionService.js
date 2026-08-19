/**
 * Servicio de compresión y optimización de imágenes en el cliente (navegador).
 * Reduce imágenes pesadas de cámara (5-15MB) a ~150-300KB sin pérdida perceptible
 * de nitidez en textos de albaranes ni detalles de obras.
 */

export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se proporcionó ningún archivo'));
    }

    const reader = new FileReader();

    reader.onerror = (error) => reject(error);

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = (error) => reject(error);

      img.onload = () => {
        let { width, height } = img;

        // Mantener relación de aspecto y limitar al máximo establecido
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: event.target.result,
            originalSize: file.size || 0,
            compressedSize: file.size || 0,
            width: img.width,
            height: img.height
          });
        }

        // Renderizado de alta calidad con suavizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Data URL optimizado
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        const head = compressedDataUrl.indexOf(',');
        const base64Data = compressedDataUrl.slice(head + 1);
        const compressedSize = Math.round((base64Data.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          originalSize: file.size || 0,
          compressedSize,
          width,
          height,
          reduction: file.size
            ? Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100))
            : 0
        });
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
