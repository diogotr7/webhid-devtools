import { defineRunnerConfig } from "wxt";

export default defineRunnerConfig({
  startUrls: [
    "https://wootility.io",
    //"https://paulirish.github.io/webhid-explorer/",
  ],
  chromiumArgs: ["--auto-open-devtools-for-tabs", "--start-maximized"],
});
