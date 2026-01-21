/**
 * Interior compositing utility
 * Places a transparent car image on a solid color background
 */

interface CompositingOptions {
  outputWidth?: number;
  outputHeight?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  quality?: number;
}

const defaultOptions: CompositingOptions = {
  outputWidth: 3840,
  outputHeight: 2560, // 3:2 aspect ratio (3840 / 3 * 2)
  paddingLeft: 0.10,
  paddingRight: 0.10,
  paddingTop: 0.05,
  paddingBottom: 0.15,
  quality: 0.92,
};

/**
 * Crops transparent padding from an image
 */
function cropTransparentPadding(img: HTMLImageElement): HTMLCanvasElement {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = img.naturalWidth;
  tempCanvas.height = img.naturalHeight;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.drawImage(img, 0, 0);

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const { data, width, height } = imageData;

  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    return tempCanvas;
  }

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;
  const croppedCtx = croppedCanvas.getContext("2d")!;

  croppedCtx.drawImage(
    tempCanvas,
    minX, minY, croppedWidth, croppedHeight,
    0, 0, croppedWidth, croppedHeight
  );

  return croppedCanvas;
}

/**
 * Loads an image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Composites a transparent car image onto a solid color background
 */
export async function compositeCarOnSolidColor(
  transparentCarUrl: string,
  backgroundColor: string,
  options?: CompositingOptions
): Promise<Blob> {
  const opts = { ...defaultOptions, ...options };

  // Load the transparent car image
  const carImg = await loadImage(transparentCarUrl);

  // Create output canvas
  const canvas = document.createElement("canvas");
  canvas.width = opts.outputWidth!;
  canvas.height = opts.outputHeight!;
  const ctx = canvas.getContext("2d")!;

  // Fill with solid color background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw car at full size (no cropping), maintaining aspect ratio and centering
  const carAspect = carImg.naturalWidth / carImg.naturalHeight;
  const canvasAspect = canvas.width / canvas.height;

  let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
  if (carAspect > canvasAspect) {
    // Car is wider than canvas - fit to width
    drawWidth = canvas.width;
    drawHeight = canvas.width / carAspect;
    drawX = 0;
    drawY = (canvas.height - drawHeight) / 2;
  } else {
    // Car is taller than canvas - fit to height
    drawHeight = canvas.height;
    drawWidth = canvas.height * carAspect;
    drawX = (canvas.width - drawWidth) / 2;
    drawY = 0;
  }

  // Draw the car without cropping - full frame
  ctx.drawImage(carImg, drawX, drawY, drawWidth, drawHeight);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/jpeg",
      opts.quality
    );
  });
}
