export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses and resizes high-resolution images via HTML5 Canvas
 * to prevent browser storage quota crashes while preserving visual quality.
 */
export const compressImage = (file: File, maxWidth: number = 1280, maxHeight: number = 960, quality: number = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If SVG or GIF, don't re-compress on canvas (keep vector/animation)
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      readFileAsDataUrl(file).then(resolve).catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          readFileAsDataUrl(file).then(resolve).catch(reject);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const createEditorImageMarkup = (dataUrl: string, caption: string = 'Obraz'): string => {
  return `
    <figure class="notion-image-block" style="margin: 1rem 0; text-align: center;">
      <img src="${dataUrl}" alt="${caption}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #333; display: inline-block; object-fit: contain;" />
      <figcaption style="font-size: 11px; color: #888; margin-top: 4px; font-style: italic;">${caption}</figcaption>
    </figure><p></p>
  `;
};
