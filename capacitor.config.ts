import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "se.luvero.app",
  appName: "Luvero",
  webDir: "dist",
  server: {
    url: "https://5b0009b5-b32d-4e58-8cc6-95ab3ae3872f.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
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
      resize: "native",
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
    scrollEnabled: false,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
