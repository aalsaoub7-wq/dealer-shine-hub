import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import testImage from "@/assets/watermark-test.jpg";

interface WatermarkPreviewProps {
  logoUrl: string;
  position: string;
  size: number;
  onPositionChange: (position: string) => void;
  onSizeChange: (size: number) => void;
}

export const WatermarkPreview = ({
  logoUrl,
  position,
  size,
  onPositionChange,
  onSizeChange,
}: WatermarkPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !logoUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.src = testImage;

    testImg.onload = () => {
      // Set canvas size to match image
      canvas.width = testImg.width;
      canvas.height = testImg.height;

      // Draw test image
      ctx.drawImage(testImg, 0, 0);

      // Draw watermark
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = logoUrl;

      logo.onload = () => {
        // Calculate logo size
        const logoMaxWidth = testImg.width * (size / 100);
        const logoScale = logoMaxWidth / logo.width;
        const logoWidth = logo.width * logoScale;
        const logoHeight = logo.height * logoScale;

        // Calculate position
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

        // Draw logo with transparency
        ctx.globalAlpha = 0.8;
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        ctx.globalAlpha = 1.0;
      };
    };
  }, [logoUrl, position, size]);

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
        <Card className="p-4 bg-secondary">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg"
          />
        </Card>
      </div>

      <div>
        <Label className="mb-2 block">Position</Label>
        <RadioGroup value={position} onValueChange={onPositionChange}>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="top-left" id="top-left" />
              <Label htmlFor="top-left" className="cursor-pointer">Övre vänster</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="top-right" id="top-right" />
              <Label htmlFor="top-right" className="cursor-pointer">Övre höger</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bottom-left" id="bottom-left" />
              <Label htmlFor="bottom-left" className="cursor-pointer">Nedre vänster</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bottom-right" id="bottom-right" />
              <Label htmlFor="bottom-right" className="cursor-pointer">Nedre höger</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="mb-2 block">Storlek ({size}%)</Label>
        <Slider
          value={[size]}
          onValueChange={(values) => onSizeChange(values[0])}
          min={5}
          max={30}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};
