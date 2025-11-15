export const applyWatermark = async (
  imageUrl: string,
  logoUrl: string,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-left',
  sizePercent: number = 15
): Promise<Blob> => {
  // Load both images
  const [image, logo] = await Promise.all([
    loadImage(imageUrl),
    loadImage(logoUrl),
  ]);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');

  // Draw original image
  ctx.drawImage(image, 0, 0);

  // Calculate logo size based on sizePercent parameter
  const logoMaxWidth = image.width * (sizePercent / 100);
  const logoScale = logoMaxWidth / logo.width;
  const logoWidth = logo.width * logoScale;
  const logoHeight = logo.height * logoScale;

  // Calculate position with padding
  const padding = 20;
  let x = padding;
  let y = padding;

  switch (position) {
    case 'top-right':
      x = canvas.width - logoWidth - padding;
      y = padding;
      break;
    case 'bottom-left':
      x = padding;
      y = canvas.height - logoHeight - padding;
      break;
    case 'bottom-right':
      x = canvas.width - logoWidth - padding;
      y = canvas.height - logoHeight - padding;
      break;
    default: // top-left
      x = padding;
      y = padding;
  }

  // Draw logo with slight transparency
  ctx.globalAlpha = 0.8;
  ctx.drawImage(logo, x, y, logoWidth, logoHeight);
  ctx.globalAlpha = 1.0;

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
      1.0
    );
  });
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};
