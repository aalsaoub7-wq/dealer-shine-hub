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
  paddingLeft: 0.10,   // 10% left margin
  paddingRight: 0.10,  // 10% right margin
  paddingTop: 0.03,    // 3% top margin
  paddingBottom: 0.17, // 17% bottom margin (car sits on "floor")
  quality: 0.85,       // JPEG quality for smaller file size
};

/**
 * Crops transparent padding from a PNG image
 * Finds the bounding box of non-transparent pixels and returns a cropped canvas
 * This ensures the car fills the available space properly regardless of original padding
 */
const cropTransparentPadding = (img: HTMLImageElement): HTMLCanvasElement => {
  // Create a canvas to analyze pixels
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  
  // Find bounding box of non-transparent pixels
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]; // Alpha channel
      if (alpha > 10) { // Non-transparent pixel (threshold to handle anti-aliasing)
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // Handle edge case where image is fully transparent
  if (minX > maxX || minY > maxY) {
    console.warn('Image appears to be fully transparent, returning original');
    return canvas;
  }
  
  // Calculate cropped dimensions
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  
  // Create cropped canvas
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d')!;
  
  // Draw only the visible portion
  croppedCtx.drawImage(
    canvas,
    minX, minY, cropWidth, cropHeight,  // Source rectangle
    0, 0, cropWidth, cropHeight          // Destination rectangle
  );
  
  console.log(`Auto-cropped transparent padding: ${img.width}x${img.height} → ${cropWidth}x${cropHeight} (removed ${((1 - (cropWidth * cropHeight) / (img.width * img.height)) * 100).toFixed(1)}% empty space)`);
  
  return croppedCanvas;
};

/**
 * Composites a transparent car image onto a studio background
 * @param transparentCarUrl - URL or data URL of the transparent car PNG
 * @param backgroundUrl - URL of the studio background image
 * @param options - Compositing options (padding, output size)
 * @returns Promise<Blob> - The composited image as a JPEG blob
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

  // AUTO-CROP: Remove transparent padding from car image
  // This ensures we work with the actual car pixels, not the original image dimensions
  const croppedCarCanvas = cropTransparentPadding(carImg);

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

  // Step 3: Calculate car size maintaining aspect ratio (using CROPPED dimensions)
  const carAspectRatio = croppedCarCanvas.width / croppedCarCanvas.height;
  let carWidth = availableWidth;
  let carHeight = carWidth / carAspectRatio;
  
  // If car is too tall, scale by height instead
  if (carHeight > availableHeight) {
    carHeight = availableHeight;
    carWidth = carHeight * carAspectRatio;
  }

  // Step 4: Position car - HORIZONTALLY CENTERED, BOTTOM ALIGNED ("floor" position)
  const carX = (opts.outputWidth - carWidth) / 2;  // Perfect horizontal center
  const carY = opts.outputHeight * (1 - opts.paddingBottom) - carHeight; // Bottom aligned to floor

  console.log(`Car placement: ${carWidth.toFixed(0)}x${carHeight.toFixed(0)} at (${carX.toFixed(0)}, ${carY.toFixed(0)})`);

  // Step 5: Draw the cropped car on top of background
  ctx.drawImage(croppedCarCanvas, carX, carY, carWidth, carHeight);

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
