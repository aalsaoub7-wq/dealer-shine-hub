import { isNativeApp } from '@/lib/utils';

export const useHaptics = () => {
  const impact = async (style: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
    if (!isNativeApp()) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const impactStyle = style === 'Light' ? ImpactStyle.Light : 
                          style === 'Heavy' ? ImpactStyle.Heavy : 
                          ImpactStyle.Medium;
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const notification = async (type: 'Success' | 'Warning' | 'Error' = 'Success') => {
    if (!isNativeApp()) return;
    
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      const notifType = type === 'Success' ? NotificationType.Success : 
                        type === 'Warning' ? NotificationType.Warning : 
                        NotificationType.Error;
      await Haptics.notification({ type: notifType });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  };

  const lightImpact = () => impact('Light');
  const mediumImpact = () => impact('Medium');
  const heavyImpact = () => impact('Heavy');
  
  const successNotification = () => notification('Success');
  const warningNotification = () => notification('Warning');
  const errorNotification = () => notification('Error');

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
