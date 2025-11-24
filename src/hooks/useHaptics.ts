import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativeApp } from '@/lib/utils';

export const useHaptics = () => {
  const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNativeApp()) return;
    
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (!isNativeApp()) return;
    
    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const lightImpact = () => impact(ImpactStyle.Light);
  const mediumImpact = () => impact(ImpactStyle.Medium);
  const heavyImpact = () => impact(ImpactStyle.Heavy);
  
  const successNotification = () => notification(NotificationType.Success);
  const warningNotification = () => notification(NotificationType.Warning);
  const errorNotification = () => notification(NotificationType.Error);

  return {
    impact,
    notification,
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
  };
};
