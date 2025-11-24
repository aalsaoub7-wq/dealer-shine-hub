import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
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
    await Keyboard.hide();
  } catch (error) {
    console.error('Hide keyboard error:', error);
  }
};

export const showKeyboard = async () => {
  if (!isNativeApp()) return;
  
  try {
    await Keyboard.show();
  } catch (error) {
    console.error('Show keyboard error:', error);
  }
};

// Splash Screen management
export const hideSplashScreen = async () => {
  if (!isNativeApp()) return;
  
  try {
    await SplashScreen.hide();
  } catch (error) {
    console.error('Hide splash screen error:', error);
  }
};

// App state management
export const setupAppListeners = () => {
  if (!isNativeApp()) return;

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

  await App.removeAllListeners();
};
