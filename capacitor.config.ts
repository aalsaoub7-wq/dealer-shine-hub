import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.luvero.app',
  appName: 'Luvero',
  webDir: 'dist',
  server: {
    url: 'https://5b0009b5-b32d-4e58-8cc6-95ab3ae3872f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false,
  }
};

export default config;
