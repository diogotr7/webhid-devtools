import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: [
      "tabs", // Required to access tab information
      "activeTab", // Required to send messages to the active tab
      "scripting", // Required to inject scripts
    ],
  },
  srcDir: "src",
});
