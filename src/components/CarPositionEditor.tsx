import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, X, Check } from "lucide-react";

interface CarPositionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transparentCarUrl: string;
  backgroundUrl: string;
  backgroundColor?: string; // If set, use solid color instead of background image
  isInterior?: boolean; // If true, use 4:3 aspect ratio instead of 3:2
  moveBackground?: boolean; // If true, user moves background instead of car (for interior image backgrounds)
  fillCanvas?: boolean; // If true, position image to cover entire canvas without margins
  onSave: (compositionBlob: Blob) => void;
  isSaving?: boolean;
}

// Default car position (matching carCompositing.ts defaults)
const DEFAULT_PADDING = {
  left: 0.10,
  right: 0.10,
  top: 0.05,
  bottom: 0.15,
};

const OUTPUT_WIDTH = 1920;

/**
 * Crops transparent padding from a PNG image
 */
const cropTransparentPadding = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
  
  if (minX > maxX || minY > maxY) {
    return canvas;
  }
  
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d')!;
  
  croppedCtx.drawImage(
    canvas,
    minX, minY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );
  
  return croppedCanvas;
};

export const CarPositionEditor = ({
  open,
  onOpenChange,
  transparentCarUrl,
  backgroundUrl,
  backgroundColor,
  isInterior = false,
  moveBackground = false,
  fillCanvas = false,
  onSave,
  isSaving = false,
}: CarPositionEditorProps) => {
  const isMobile = useIsMobile();
  
  // Dynamic height based on whether it's interior (4:3) or regular (3:2)
  const OUTPUT_HEIGHT = isInterior ? 1440 : 1280;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const carCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSelected, setIsSelected] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [carRotation, setCarRotation] = useState(0);
  
  // Car position and size state
  const [carX, setCarX] = useState(0);
  const [carY, setCarY] = useState(0);
  const [carWidth, setCarWidth] = useState(0);
  const [carHeight, setCarHeight] = useState(0);
  const [carAspectRatio, setCarAspectRatio] = useState(1);
  
  // Background position state (for moveBackground mode)
  const [bgX, setBgX] = useState(0);
  const [bgY, setBgY] = useState(0);
  const [bgScale, setBgScale] = useState(1);
  const bgAspectRatioRef = useRef(1);

  // Calculate initial car position based on default padding or fill canvas
  const calculateInitialPosition = useCallback((croppedCanvas: HTMLCanvasElement) => {
    const aspectRatio = croppedCanvas.width / croppedCanvas.height;
    setCarAspectRatio(aspectRatio);
    
    // If fillCanvas is true, scale image to cover entire canvas without margins
    if (fillCanvas) {
      const canvasAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;
      let width: number, height: number;
      
      if (aspectRatio > canvasAspect) {
        // Image is wider than canvas - match height
        height = OUTPUT_HEIGHT;
        width = height * aspectRatio;
      } else {
        // Image is taller/equal - match width
        width = OUTPUT_WIDTH;
        height = width / aspectRatio;
      }
      
      // Center the image
      const x = (OUTPUT_WIDTH - width) / 2;
      const y = (OUTPUT_HEIGHT - height) / 2;
      
      setCarX(x);
      setCarY(y);
      setCarWidth(width);
      setCarHeight(height);
      return;
    }
    
    // Default behavior with margins
    const availableWidth = OUTPUT_WIDTH * (1 - DEFAULT_PADDING.left - DEFAULT_PADDING.right);
    const availableHeight = OUTPUT_HEIGHT * (1 - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom);
    
    let width = availableWidth;
    let height = width / aspectRatio;
    
    if (height > availableHeight) {
      height = availableHeight;
      width = height * aspectRatio;
    }
    
    const x = (OUTPUT_WIDTH - width) / 2;
    const y = OUTPUT_HEIGHT * (1 - DEFAULT_PADDING.bottom) - height;
    
    setCarX(x);
    setCarY(y);
    setCarWidth(width);
    setCarHeight(height);
  }, [fillCanvas, OUTPUT_HEIGHT]);

  // Load images
  useEffect(() => {
    if (!open || !transparentCarUrl) return;
    // Need either backgroundUrl or backgroundColor
    if (!backgroundUrl && !backgroundColor) return;
    
    setImagesLoaded(false);
    
    // For solid color background, create a canvas instead of loading image
    if (backgroundColor) {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = OUTPUT_WIDTH;
      bgCanvas.height = OUTPUT_HEIGHT;
      const bgCtx = bgCanvas.getContext('2d')!;
      bgCtx.fillStyle = backgroundColor;
      bgCtx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      
      // Create an image from the canvas
      const bgImg = new Image();
      bgImg.src = bgCanvas.toDataURL();
      bgImg.onload = () => {
        bgImgRef.current = bgImg;
        checkBothLoaded();
      };
    } else {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = backgroundUrl;
      bgImg.onload = () => {
        bgImgRef.current = bgImg;
        bgAspectRatioRef.current = bgImg.width / bgImg.height;
        // For moveBackground mode, calculate initial centered position
        if (moveBackground) {
          const targetAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;
          const imgAspect = bgImg.width / bgImg.height;
          let scale: number;
          if (imgAspect > targetAspect) {
            // Image is wider, fit by height
            scale = OUTPUT_HEIGHT / bgImg.height;
          } else {
            // Image is taller, fit by width
            scale = OUTPUT_WIDTH / bgImg.width;
          }
          setBgScale(scale);
          const scaledWidth = bgImg.width * scale;
          const scaledHeight = bgImg.height * scale;
          setBgX((OUTPUT_WIDTH - scaledWidth) / 2);
          setBgY((OUTPUT_HEIGHT - scaledHeight) / 2);
        }
        checkBothLoaded();
      };
    }

    const carImg = new Image();
    carImg.crossOrigin = 'anonymous';
    carImg.src = transparentCarUrl;
    carImg.onload = () => {
      const croppedCanvas = cropTransparentPadding(carImg);
      carCanvasRef.current = croppedCanvas;
      calculateInitialPosition(croppedCanvas);
      checkBothLoaded();
    };

    const checkBothLoaded = () => {
      if (bgImgRef.current && carCanvasRef.current) {
        setImagesLoaded(true);
      }
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, transparentCarUrl, backgroundUrl, backgroundColor, calculateInitialPosition]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !bgImgRef.current || !carCanvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== OUTPUT_WIDTH) {
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (moveBackground) {
      // moveBackground mode: car is centered, background moves
      // Draw background at position with scale
      const scaledWidth = bgImgRef.current.width * bgScale;
      const scaledHeight = bgImgRef.current.height * bgScale;
      ctx.drawImage(bgImgRef.current, bgX, bgY, scaledWidth, scaledHeight);
      
      // Draw car centered at fixed position
      ctx.drawImage(carCanvasRef.current, carX, carY, carWidth, carHeight);
      
      // Draw selection frame around background area
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6'; // Blue for background
        ctx.lineWidth = 8;
        ctx.strokeRect(bgX, bgY, scaledWidth, scaledHeight);
        
        // Draw resize handle for background
        const handleSize = isMobile ? 60 : 40;
        const handleX = bgX + scaledWidth;
        const handleY = bgY + scaledHeight;
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw resize arrows
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        const arrowSize = 18;
        const arrowOffset = arrowSize / Math.sqrt(2);
        
        ctx.beginPath();
        ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset);
        ctx.lineTo(handleX + arrowOffset, handleY + arrowOffset);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset);
        ctx.lineTo(handleX - arrowOffset + 8, handleY - arrowOffset);
        ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset);
        ctx.lineTo(handleX - arrowOffset, handleY - arrowOffset + 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(handleX + arrowOffset, handleY + arrowOffset);
        ctx.lineTo(handleX + arrowOffset - 8, handleY + arrowOffset);
        ctx.moveTo(handleX + arrowOffset, handleY + arrowOffset);
        ctx.lineTo(handleX + arrowOffset, handleY + arrowOffset - 8);
        ctx.stroke();
      }
    } else {
      // Normal mode: background fixed, car moves
      ctx.drawImage(bgImgRef.current, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      // Draw car with rotation
      const centerX = carX + carWidth / 2;
      const centerY = carY + carHeight / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(carRotation);
      ctx.drawImage(carCanvasRef.current, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
      ctx.restore();

      // Draw selection frame if selected (also rotated)
      if (isSelected) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(carRotation);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 8;
        ctx.strokeRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight);
        
        // Draw resize handle (bottom-right corner)
        const handleSize = isMobile ? 60 : 40;
        const rhX = carWidth / 2;
        const rhY = carHeight / 2;
        
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(rhX, rhY, handleSize, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rhX, rhY, handleSize, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw resize arrows
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        const arrowSize = 18;
        const arrowOffset = arrowSize / Math.sqrt(2);
        
        ctx.beginPath();
        ctx.moveTo(rhX - arrowOffset, rhY - arrowOffset);
        ctx.lineTo(rhX + arrowOffset, rhY + arrowOffset);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(rhX - arrowOffset, rhY - arrowOffset);
        ctx.lineTo(rhX - arrowOffset + 8, rhY - arrowOffset);
        ctx.moveTo(rhX - arrowOffset, rhY - arrowOffset);
        ctx.lineTo(rhX - arrowOffset, rhY - arrowOffset + 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(rhX + arrowOffset, rhY + arrowOffset);
        ctx.lineTo(rhX + arrowOffset - 8, rhY + arrowOffset);
        ctx.moveTo(rhX + arrowOffset, rhY + arrowOffset);
        ctx.lineTo(rhX + arrowOffset, rhY + arrowOffset - 8);
        ctx.stroke();

        // Draw rotation handle (top-center)
        const rotHandleOffset = 60;
        const rotHandleX = 0;
        const rotHandleY = -carHeight / 2 - rotHandleOffset;
        
        // Line from top-center to rotation handle
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -carHeight / 2);
        ctx.lineTo(rotHandleX, rotHandleY);
        ctx.stroke();
        
        // Green circle
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(rotHandleX, rotHandleY, handleSize, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rotHandleX, rotHandleY, handleSize, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw rotation icon (↻)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rotHandleX, rotHandleY, 14, -Math.PI * 0.7, Math.PI * 0.5);
        ctx.stroke();
        // Arrowhead
        const arrowTipX = rotHandleX + 14 * Math.cos(Math.PI * 0.5);
        const arrowTipY = rotHandleY + 14 * Math.sin(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(arrowTipX - 6, arrowTipY - 6);
        ctx.lineTo(arrowTipX, arrowTipY);
        ctx.lineTo(arrowTipX + 6, arrowTipY - 4);
        ctx.stroke();

        ctx.restore();
      }
    }
  }, [carX, carY, carWidth, carHeight, bgX, bgY, bgScale, isSelected, isMobile, moveBackground, carRotation]);

  // Trigger render when state changes
  useEffect(() => {
    if (!imagesLoaded) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [renderCanvas, imagesLoaded]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !bgImgRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const handleSize = isMobile ? 60 : 40;
    
    if (moveBackground) {
      // In moveBackground mode, we're selecting/dragging the background
      const scaledWidth = bgImgRef.current.width * bgScale;
      const scaledHeight = bgImgRef.current.height * bgScale;
      const handleX = bgX + scaledWidth;
      const handleY = bgY + scaledHeight;
      
      const distanceToHandle = Math.sqrt(
        Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2)
      );
      
      if (distanceToHandle <= handleSize && isSelected) {
        setIsResizing(true);
        return;
      }

      if (mouseX >= bgX && mouseX <= bgX + scaledWidth && 
          mouseY >= bgY && mouseY <= bgY + scaledHeight) {
        setIsSelected(true);
        setIsDragging(true);
        setDragOffset({ x: mouseX - bgX, y: mouseY - bgY });
      } else {
        setIsSelected(false);
      }
    } else {
      // Normal mode: select/drag car
      // All handle positions must account for rotation
      const centerX = carX + carWidth / 2;
      const centerY = carY + carHeight / 2;
      const cosR = Math.cos(carRotation);
      const sinR = Math.sin(carRotation);

      // Resize handle (bottom-right corner, rotated)
      const resLocalX = carWidth / 2;
      const resLocalY = carHeight / 2;
      const resWorldX = centerX + resLocalX * cosR - resLocalY * sinR;
      const resWorldY = centerY + resLocalX * sinR + resLocalY * cosR;
      
      const distToResize = Math.sqrt(
        Math.pow(mouseX - resWorldX, 2) + Math.pow(mouseY - resWorldY, 2)
      );
      
      if (distToResize <= handleSize && isSelected) {
        setIsResizing(true);
        return;
      }

      // Rotation handle (top-center, offset above car)
      const rotHandleOffset = 60;
      const rotLocalX = 0;
      const rotLocalY = -carHeight / 2 - rotHandleOffset;
      const rotWorldX = centerX + rotLocalX * cosR - rotLocalY * sinR;
      const rotWorldY = centerY + rotLocalX * sinR + rotLocalY * cosR;
      
      const distToRotate = Math.sqrt(
        Math.pow(mouseX - rotWorldX, 2) + Math.pow(mouseY - rotWorldY, 2)
      );
      
      if (distToRotate <= handleSize && isSelected) {
        setIsRotating(true);
        return;
      }

      // Hit-test car body (transform mouse into car-local coords)
      const localX = (mouseX - centerX) * cosR + (mouseY - centerY) * sinR;
      const localY = -(mouseX - centerX) * sinR + (mouseY - centerY) * cosR;
      
      if (localX >= -carWidth / 2 && localX <= carWidth / 2 && 
          localY >= -carHeight / 2 && localY <= carHeight / 2) {
        setIsSelected(true);
        setIsDragging(true);
        setDragOffset({ x: mouseX - carX, y: mouseY - carY });
      } else {
        setIsSelected(false);
      }
    }
  }, [carX, carY, carWidth, carHeight, bgX, bgY, bgScale, isSelected, isMobile, moveBackground, carRotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !bgImgRef.current || (!isDragging && !isResizing && !isRotating)) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (moveBackground) {
      // Moving/resizing the background
      if (isResizing) {
        const dx = Math.max(100, mouseX - bgX);
        const newScale = dx / bgImgRef.current.width;
        setBgScale(Math.max(0.1, Math.min(5, newScale)));
        return;
      }

      if (isDragging) {
        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;
        setBgX(newX);
        setBgY(newY);
      }
    } else {
      // Rotating the car
      if (isRotating) {
        const centerX = carX + carWidth / 2;
        const centerY = carY + carHeight / 2;
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX) + Math.PI / 2;
        setCarRotation(angle);
        return;
      }

      // Moving/resizing the car
      if (isResizing) {
        const centerX = carX + carWidth / 2;
        const centerY = carY + carHeight / 2;
        // Project mouse into local (un-rotated) space for resize
        const cosR = Math.cos(-carRotation);
        const sinR = Math.sin(-carRotation);
        const localMouseX = centerX + (mouseX - centerX) * cosR - (mouseY - centerY) * sinR;
        const localMouseY = centerY + (mouseX - centerX) * sinR + (mouseY - centerY) * cosR;
        
        const dx = Math.max(100, localMouseX - (centerX - carWidth / 2));
        const dy = Math.max(100, localMouseY - (centerY - carHeight / 2));

        let newWidth = dx;
        let newHeight = newWidth / carAspectRatio;
        if (newHeight > dy) {
          newHeight = dy;
          newWidth = newHeight * carAspectRatio;
        }

        setCarWidth(Math.min(OUTPUT_WIDTH * 3, newWidth));
        setCarHeight(Math.min(OUTPUT_HEIGHT * 3, newHeight));
        return;
      }

      if (isDragging) {
        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;
        setCarX(newX);
        setCarY(newY);
      }
    }
  }, [isDragging, isResizing, isRotating, carX, carY, carWidth, carHeight, bgX, bgY, dragOffset, carAspectRatio, moveBackground, carRotation]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!canvasRef.current || !bgImgRef.current || !carCanvasRef.current) return;

    // Create a clean canvas for export (without selection frame)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = OUTPUT_WIDTH;
    exportCanvas.height = OUTPUT_HEIGHT;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (moveBackground) {
      // Draw background at current position/scale
      const scaledWidth = bgImgRef.current.width * bgScale;
      const scaledHeight = bgImgRef.current.height * bgScale;
      ctx.drawImage(bgImgRef.current, bgX, bgY, scaledWidth, scaledHeight);
      // Draw car at its fixed position
      ctx.drawImage(carCanvasRef.current, carX, carY, carWidth, carHeight);
    } else {
      // Normal mode (with rotation)
      ctx.drawImage(bgImgRef.current, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      const centerX = carX + carWidth / 2;
      const centerY = carY + carHeight / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(carRotation);
      ctx.drawImage(carCanvasRef.current, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
      ctx.restore();
    }

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob);
        }
      },
      'image/jpeg',
      0.85
    );
  }, [carX, carY, carWidth, carHeight, bgX, bgY, bgScale, moveBackground, onSave, carRotation]);

  if (!open) return null;

  if (!imagesLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Laddar bilder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h2 className="text-lg font-semibold">
          {moveBackground ? "Justera bakgrundens position" : "Justera bilens position"}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain cursor-move touch-none shadow-lg rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const syntheticEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>;
            handleMouseDown(syntheticEvent);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const syntheticEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>;
            handleMouseMove(syntheticEvent);
          }}
          onTouchEnd={handleMouseUp}
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {moveBackground 
              ? "Klicka på bakgrunden för att välja den. Dra för att flytta, dra den blåa pricken för att ändra storlek."
              : "Klicka på bilen för att välja den. Dra för att flytta, dra den röda pricken för att ändra storlek, dra den gröna pricken för att rotera."
            }
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={!imagesLoaded || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {moveBackground ? "Spara" : (backgroundColor ? "Spara" : "Spara och lägg till reflektion")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};