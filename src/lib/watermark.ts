export const applyWatermark = async (
  imageUrl: string,
  logoUrl: string,
  xPercent: number = 2,
  yPercent: number = 2,
  sizePercent: number = 15,
  opacity: number = 0.8
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

  // Calculate logo size based on sizePercent parameter (relative to image width)
  const logoMaxWidth = image.width * (sizePercent / 100);
  const logoScale = logoMaxWidth / logo.width;
  const logoWidth = logo.width * logoScale;
  const logoHeight = logo.height * logoScale;

  // Convert percentage coordinates to actual pixel positions
  const x = image.width * (xPercent / 100);
  const y = image.height * (yPercent / 100);

  // Draw logo with transparency
  ctx.globalAlpha = opacity;
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
