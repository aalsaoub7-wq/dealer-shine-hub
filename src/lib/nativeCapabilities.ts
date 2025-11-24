import { isNativeApp } from './utils';

// Share functionality
export const nativeShare = async (title: string, text: string, url: string) => {
  if (!isNativeApp()) {
    // Fallback to Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        console.error('Web share error:', error);
        return false;
      }
    }
    return false;
  }

  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title,
      text,
      url,
      dialogTitle: title,
    });
    return true;
  } catch (error) {
    console.error('Native share error:', error);
    return false;
  }
};

// Keyboard management
export const hideKeyboard = async () => {
  if (!isNativeApp()) return;
  
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    await Keyboard.hide();
  } catch (error) {
    console.error('Hide keyboard error:', error);
  }
};

export const showKeyboard = async () => {
  if (!isNativeApp()) return;
  
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    await Keyboard.show();
  } catch (error) {
    console.error('Show keyboard error:', error);
  }
};

// Splash Screen management
export const hideSplashScreen = async () => {
  if (!isNativeApp()) return;
  
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (error) {
    console.error('Hide splash screen error:', error);
  }
};

// App state management
export const setupAppListeners = async () => {
  if (!isNativeApp()) return;

  const { App } = await import('@capacitor/app');

  App.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });

  App.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active:', isActive);
  });

  App.addListener('appUrlOpen', (data) => {
    console.log('App opened with URL:', data.url);
    // Handle deep linking here if needed
  });
};

// Cleanup listeners
export const removeAppListeners = async () => {
  if (!isNativeApp()) return;

  const { App } = await import('@capacitor/app');
  await App.removeAllListeners();
};
