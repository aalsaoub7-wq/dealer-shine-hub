import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "se.luvero.app",
  appName: "Luvero",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0f",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: "none",
      style: "dark",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a0f",
    },
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
