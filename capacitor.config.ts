import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finansaltakip.app',
  appName: 'Finansal Takip',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    // Bildirimlere izin vermek için
  },
};

export default config;
