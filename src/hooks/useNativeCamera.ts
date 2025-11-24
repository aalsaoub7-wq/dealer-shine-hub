import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativeApp } from '@/lib/utils';
import { toast } from 'sonner';

export interface UseNativeCameraOptions {
  onPhotoCaptured?: (photo: File) => void;
  allowMultiple?: boolean;
}

export const useNativeCamera = (options: UseNativeCameraOptions = {}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const takePicture = async (source: CameraSource = CameraSource.Camera) => {
    if (!isNativeApp()) {
      return null;
    }

    try {
      setIsCapturing(true);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: source,
        saveToGallery: false,
      });

      if (image.webPath) {
        // Convert to File object
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
      if (error.message !== 'User cancelled photos app') {
        console.error('Error capturing photo:', error);
        toast.error('Kunde inte ta foto');
      }
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const takePhoto = () => takePicture(CameraSource.Camera);
  const pickFromGallery = () => takePicture(CameraSource.Photos);

  return {
    takePhoto,
    pickFromGallery,
    isCapturing,
  };
};
