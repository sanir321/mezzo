import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mezzo.music",
  appName: "Mezzo",
  webDir: "build",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
    // Keep the social-OAuth loop inside the WebView instead of handing it to
    // an external browser: Google consent -> pages.dev callback (sets the
    // session cookie in the WebView's own jar) -> back to the app origin.
    allowNavigation: ["accounts.google.com", "mezzo-music.pages.dev", "*.googleusercontent.com"],
  },
};

export default config;