import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import testImage from "@/assets/watermark-test.jpg";

interface WatermarkPreviewProps {
  logoUrl: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (size: number) => void;
}

export const WatermarkPreview = ({
  logoUrl,
  x,
  y,
  size,
  opacity,
  onPositionChange,
  onSizeChange,
}: WatermarkPreviewProps) => {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const testImgRef = useRef<HTMLImageElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Local state for smooth interaction
  const [localX, setLocalX] = useState(x);
  const [localY, setLocalY] = useState(y);
  const [localSize, setLocalSize] = useState(size);
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [logoSize, setLogoSize] = useState({ width: 0, height: 0 });

  // Sync local state with props when not interacting
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setLocalX(x);
      setLocalY(y);
      setLocalSize(size);
      setLocalOpacity(opacity);
    }
  }, [x, y, size, opacity, isDragging, isResizing]);

  // Load images once
  useEffect(() => {
    if (!logoUrl) return;

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.src = testImage;
    testImg.onload = () => {
      testImgRef.current = testImg;
      renderCanvas();
    };

    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.src = logoUrl;
    logo.onload = () => {
      logoImgRef.current = logo;
      renderCanvas();
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [logoUrl]);

  // Render canvas efficiently
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !testImgRef.current || !logoImgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size once
    if (canvas.width !== 3840) {
      canvas.width = 3840;
      canvas.height = 2880;
    }

    // Clear and draw test image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(testImgRef.current, 0, 0, 3840, 2880);

    // Calculate logo size
    const logoMaxWidth = canvas.width * (localSize / 100);
    const logoScale = logoMaxWidth / logoImgRef.current.width;
    const logoWidth = logoImgRef.current.width * logoScale;
    const logoHeight = logoImgRef.current.height * logoScale;
    
    setLogoSize({ width: logoWidth, height: logoHeight });

    // Draw logo with transparency
    ctx.globalAlpha = localOpacity;
    ctx.drawImage(logoImgRef.current, localX, localY, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;

    // Draw selection frame if selected
    if (isSelected) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 12;
      ctx.strokeRect(localX, localY, logoWidth, logoHeight);
      
      // Draw resize handle (red circle in bottom-right corner)
      const handleSize = isMobile ? 100 : 70;
      const handleX = localX + logoWidth;
      const handleY = localY + logoHeight;
      
      // Draw red circle background
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw white circle border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw diagonal double arrow inside the circle (white)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      
      const arrowSize = 28;
      const arrowOffset = arrowSize / Math.sqrt(2);
      
      // Main diagonal line
      ctx.beginPath();
      ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset);
      ctx.lineTo(handleX + arrowOffset, handleY + arrowOffset);
      ctx.stroke();
      
      // Top-left arrow head
      ctx.beginPath();
      ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset);
      ctx.lineTo(handleX - arrowOffset + 10, handleY - arrowOffset);
      ctx.moveTo(handleX - arrowOffset, handleY - arrowOffset);
      ctx.lineTo(handleX - arrowOffset, handleY - arrowOffset + 10);
      ctx.stroke();
      
      // Bottom-right arrow head
      ctx.beginPath();
      ctx.moveTo(handleX + arrowOffset, handleY + arrowOffset);
      ctx.lineTo(handleX + arrowOffset - 10, handleY + arrowOffset);
      ctx.moveTo(handleX + arrowOffset, handleY + arrowOffset);
      ctx.lineTo(handleX + arrowOffset, handleY + arrowOffset - 10);
      ctx.stroke();
    }
  }, [localX, localY, localSize, localOpacity, isSelected]);

  // Trigger render when local state changes
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [renderCanvas]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const handleSize = 70;
    const handleX = localX + logoSize.width;
    const handleY = localY + logoSize.height;
    
    // Check if click is on resize handle
    const distanceToHandle = Math.sqrt(
      Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2)
    );
    
    if (distanceToHandle <= handleSize && isSelected) {
      setIsResizing(true);
      return;
    }

    // Check if click is within logo bounds
    if (mouseX >= localX && mouseX <= localX + logoSize.width && 
        mouseY >= localY && mouseY <= localY + logoSize.height) {
      setIsSelected(true);
      setIsDragging(true);
      setDragOffset({ x: mouseX - localX, y: mouseY - localY });
    } else {
      setIsSelected(false);
    }
  }, [localX, localY, logoSize, isSelected]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || (!isDragging && !isResizing)) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isResizing && logoImgRef.current) {
      // Resize so that bottom-right corner follows the cursor while keeping aspect ratio
      const dx = Math.max(1, mouseX - localX);
      const dy = Math.max(1, mouseY - localY);
      const ar = logoImgRef.current.height / logoImgRef.current.width;

      let width = dx;
      let height = width * ar;
      if (height > dy) {
        height = dy;
        width = height / ar;
      }

      // Map width to percentage of canvas width
      const newSize = (width / canvas.width) * 100;
      setLocalSize(Math.max(1, Math.min(400, newSize)));
      return;
    }

    if (isDragging) {
      // Allow free positioning anywhere on canvas
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;
      setLocalX(newX);
      setLocalY(newY);
    }
  }, [isDragging, isResizing, localX, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onPositionChange(localX, localY);
    }
    if (isResizing) {
      onSizeChange(localSize);
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, isResizing, localX, localY, localSize, onPositionChange, onSizeChange]);

  if (!logoUrl) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Ladda upp en logotyp först för att se förhandsvisning
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Förhandsvisning</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Klicka på vattenmärket för att välja det. Dra för att flytta, dra den röda pricken för att ändra storlek.
        </p>
        <Card className="p-4 bg-muted/30 border-muted">
          <canvas
            ref={canvasRef}
            className="w-full h-auto cursor-move touch-none"
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
        </Card>
      </div>

    </div>
  );
};
