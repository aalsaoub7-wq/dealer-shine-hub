import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Check } from "lucide-react";

interface InteriorColorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColorSelected: (color: string) => void;
  colorHistory: string[];
  isProcessing?: boolean;
}

export function InteriorColorDialog({
  open,
  onOpenChange,
  onColorSelected,
  colorHistory,
  isProcessing = false,
}: InteriorColorDialogProps) {
  const [selectedColor, setSelectedColor] = useState("#c8cfdb");

  const handleSubmit = () => {
    onColorSelected(selectedColor);
  };

  const handleHistoryClick = (color: string) => {
    setSelectedColor(color);
  };

  // Default preset colors
  const presetColors = [
    "#ffffff", // White
    "#f5f5f5", // Light gray
    "#e0e0e0", // Gray
    "#c8cfdb", // Light blue-gray (default)
    "#1a1a1a", // Dark gray
    "#000000", // Black
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Välj bakgrundsfärg
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Color picker */}
          <div className="space-y-2">
            <Label htmlFor="color-picker">Bakgrundsfärg</Label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <Input
                id="color-picker"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="flex-1 font-mono uppercase"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Preset colors */}
          <div className="space-y-2">
            <Label>Standardfärger</Label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleHistoryClick(color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedColor === color
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Color history */}
          {colorHistory.length > 0 && (
            <div className="space-y-2">
              <Label>Tidigare använda</Label>
              <div className="flex flex-wrap gap-2">
                {colorHistory.slice(0, 12).map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={() => handleHistoryClick(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                      selectedColor === color
                        ? "border-primary ring-2 ring-primary/50"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {selectedColor === color && (
                      <Check className="w-4 h-4 mx-auto text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? "Bearbetar..." : "Fortsätt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
