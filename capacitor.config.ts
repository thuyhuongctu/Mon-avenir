import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.thuyhuongctu.monavenir",
  appName: "Mon Avenir",
  webDir: "dist",
  android: { allowMixedContent: false },
  server: { androidScheme: "https" },
};

export default config;
