import { useState } from 'react';
import { isNativeApp } from '@/lib/utils';
import { toast } from 'sonner';

export interface UseNativeCameraOptions {
  onPhotoCaptured?: (photo: File) => void;
  allowMultiple?: boolean;
}

export const useNativeCamera = (options: UseNativeCameraOptions = {}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const resetViewport = () => {
    // Återställ #root scroll-position (den faktiska scroll-containern)
    const root = document.getElementById('root');
    if (root) {
      root.scrollTop = 0;
    }
    
    // Återställ även window för säkerhets skull
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Tvinga en re-layout genom att trigga en liten viewport-justering
    document.body.style.minHeight = '100.1vh';
    requestAnimationFrame(() => {
      document.body.style.minHeight = '';
    });
  };

  const takePicture = async (sourceType: 'camera' | 'photos' = 'camera') => {
    if (!isNativeApp()) {
      return null;
    }

    try {
      setIsCapturing(true);
      
      // Använd Capacitor's globala plugin-objekt istället för dynamisk import
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor?.Plugins?.Camera) {
        toast.error('Kamera-plugin är inte tillgänglig');
        return null;
      }

      const Camera = Capacitor.Plugins.Camera;

      // Definiera konstanter som används av Camera plugin
      const CameraResultType = {
        Uri: 'uri',
        Base64: 'base64',
        DataUrl: 'dataUrl'
      };

      const CameraSource = {
        Prompt: 'PROMPT',
        Camera: 'CAMERA',
        Photos: 'PHOTOS'
      };
      
      // Kontrollera och begär behörigheter först
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        const requested = await Camera.requestPermissions();
        if (requested.camera !== 'granted' && sourceType === 'camera') {
          toast.error('Kamerabehörighet krävs för att ta foton');
          return null;
        }
        if (requested.photos !== 'granted' && sourceType === 'photos') {
          toast.error('Fotobehörighet krävs för att välja bilder');
          return null;
        }
      }
      
      const source = sourceType === 'camera' ? CameraSource.Camera : CameraSource.Photos;
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source,
        saveToGallery: false,
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        options.onPhotoCaptured?.(file);
        return file;
      }

      return null;
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.message !== 'User cancelled photos app') {
        toast.error(`Kunde inte ${sourceType === 'camera' ? 'ta foto' : 'välja bild'}: ${error.message}`);
      }
      return null;
    } finally {
      setIsCapturing(false);
      
      // Återställ viewport efter kamerainteraktion
      setTimeout(() => {
        resetViewport();
      }, 100);
    }
  };

  const takePhoto = () => takePicture('camera');
  const pickFromGallery = () => takePicture('photos');

  return {
    takePhoto,
    pickFromGallery,
    isCapturing,
  };
};
