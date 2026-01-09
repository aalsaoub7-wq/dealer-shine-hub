/**
 * Canvas-based car compositing utility
 * Places a transparent car image on a studio background with precise padding
 * Uses the same proven Canvas technique as watermark.ts
 */

export interface CompositingOptions {
  outputWidth?: number;
  outputHeight?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  quality?: number; // 0-1 for JPEG quality
}

const defaultOptions: Required<CompositingOptions> = {
  outputWidth: 1920,   // Reduced from 3840 to prevent memory issues
  outputHeight: 1440,  // Reduced from 2880 (maintains 4:3 ratio)
  paddingLeft: 0.10,   // 10%
  paddingRight: 0.10,  // 10%
  paddingTop: 0.15,    // 15%
  paddingBottom: 0.05, // 5%
  quality: 0.85,       // JPEG quality for smaller file size
};

/**
 * Composites a transparent car image onto a studio background
 * @param transparentCarUrl - URL or data URL of the transparent car PNG
 * @param backgroundUrl - URL of the studio background image
 * @param options - Compositing options (padding, output size)
 * @returns Promise<Blob> - The composited image as a PNG blob
 */
export const compositeCarOnBackground = async (
  transparentCarUrl: string,
  backgroundUrl: string,
  options: CompositingOptions = {}
): Promise<Blob> => {
  const opts = { ...defaultOptions, ...options };
  
  // Load both images in parallel
  const [carImg, bgImg] = await Promise.all([
    loadImage(transparentCarUrl),
    loadImage(backgroundUrl),
  ]);

  // Create canvas with output dimensions
  const canvas = document.createElement('canvas');
  canvas.width = opts.outputWidth;
  canvas.height = opts.outputHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Step 1: Draw background (scaled to fill)
  ctx.drawImage(bgImg, 0, 0, opts.outputWidth, opts.outputHeight);

  // Step 2: Calculate available space after padding
  const availableWidth = opts.outputWidth * (1 - opts.paddingLeft - opts.paddingRight);
  const availableHeight = opts.outputHeight * (1 - opts.paddingTop - opts.paddingBottom);

  // Step 3: Calculate car size maintaining aspect ratio
  const carAspectRatio = carImg.width / carImg.height;
  let carWidth = availableWidth;
  let carHeight = carWidth / carAspectRatio;
  
  // If car is too tall, scale by height instead
  if (carHeight > availableHeight) {
    carHeight = availableHeight;
    carWidth = carHeight * carAspectRatio;
  }

  // Step 4: Center car within the available space
  const carX = opts.outputWidth * opts.paddingLeft + (availableWidth - carWidth) / 2;
  const carY = opts.outputHeight * opts.paddingTop + (availableHeight - carHeight) / 2;

  // Step 5: Draw transparent car on top of background
  ctx.drawImage(carImg, carX, carY, carWidth, carHeight);

  // Convert canvas to JPEG blob (smaller file size than PNG)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log(`Composited image size: ${(blob.size / 1024).toFixed(0)}KB`);
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      opts.quality
    );
  });
};

/**
 * Loads an image from a URL
 * @param url - Image URL (can be data URL or regular URL)
 * @returns Promise<HTMLImageElement>
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${url.substring(0, 100)}...`));
    img.src = url;
  });
};
