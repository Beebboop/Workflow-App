import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vkr.workflowapp',
  appName: 'Workflow Management',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'http://10.0.2.2:5173', 
    cleartext: true
  },
  android: {
    allowMixedContent: true, // Разрешаем смешанный контент
    webContentsDebuggingEnabled: true,
    buildOptions: {
      releaseType: 'AAB'
    }
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;