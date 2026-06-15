import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.linje.linjetune",
  appName: "LinjeTune",
  webDir: "speedtest-app/tunelab-mobile",
  server: {
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [
      "generativelanguage.googleapis.com",
      "api.anthropic.com",
      "api.openai.com",
      "api.x.ai",
      "gemini.google.com",
      "aistudio.google.com",
      "raw.githubusercontent.com",
    ],
  },
  android: {
    minWebViewVersion: 80,
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#050505",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050505",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
