import { Card } from "@/components/ui/card";

interface LandingPagePreviewProps {
  logoUrl: string;
  headerImageUrl: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  title: string;
  description: string;
  footerText: string;
  layout: 'grid' | 'carousel' | 'masonry';
  logoSize: 'small' | 'medium' | 'large';
  logoPosition: 'left' | 'center' | 'right';
  headerHeight: 'small' | 'medium' | 'large';
  headerFit: 'cover' | 'contain' | 'fill';
}

export const LandingPagePreview = ({
  logoUrl,
  headerImageUrl,
  backgroundColor,
  textColor,
  accentColor,
  title,
  description,
  footerText,
  layout,
  logoSize,
  logoPosition,
  headerHeight,
  headerFit,
}: LandingPagePreviewProps) => {
  const logoSizeClass = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16'
  }[logoSize];

  const logoPositionClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[logoPosition];

  const headerHeightClass = {
    small: 'h-16',
    medium: 'h-24',
    large: 'h-32'
  }[headerHeight];

  const headerFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill'
  }[headerFit];
  return (
    <Card className="overflow-hidden border-2">
      <div 
        className="p-4 space-y-3"
        style={{ backgroundColor }}
      >
        {/* Header */}
        <div className="space-y-2">
          {logoUrl && (
            <div className={`flex ${logoPositionClass}`}>
              <img 
                src={logoUrl} 
                alt="Logo" 
                className={`${logoSizeClass} object-contain`}
              />
            </div>
          )}
          {headerImageUrl && (
            <img 
              src={headerImageUrl} 
              alt="Header" 
              className={`w-full ${headerHeightClass} ${headerFitClass} rounded`}
            />
          )}
          <h1 
            className="text-xl font-bold text-center"
            style={{ color: textColor }}
          >
            {title || 'Mina Bilder'}
          </h1>
          {description && (
            <p 
              className="text-sm text-center"
              style={{ color: textColor, opacity: 0.8 }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Photos Preview */}
        <div className="space-y-2">
          {layout === 'grid' && (
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-muted rounded"
                  style={{ opacity: 0.3 }}
                />
              ))}
            </div>
          )}
          {layout === 'carousel' && (
            <div className="aspect-video bg-muted rounded" style={{ opacity: 0.3 }} />
          )}
          {layout === 'masonry' && (
            <div className="grid grid-cols-3 gap-1">
              <div className="aspect-[3/4] bg-muted rounded" style={{ opacity: 0.3 }} />
              <div className="aspect-square bg-muted rounded" style={{ opacity: 0.3 }} />
              <div className="aspect-[4/3] bg-muted rounded" style={{ opacity: 0.3 }} />
            </div>
          )}
        </div>

        {/* Download Button Preview */}
        <div className="flex justify-center">
          <div 
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: accentColor,
              color: '#ffffff'
            }}
          >
            Ladda ner
          </div>
        </div>

        {/* Footer */}
        {footerText && (
          <p 
            className="text-xs text-center mt-2"
            style={{ color: textColor, opacity: 0.6 }}
          >
            {footerText}
          </p>
        )}
      </div>
    </Card>
  );
};
