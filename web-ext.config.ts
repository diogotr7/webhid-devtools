import { defineRunnerConfig } from "wxt";

export default defineRunnerConfig({
  startUrls: ["https://wootility.io"],
  chromiumArgs: ["--auto-open-devtools-for-tabs", "--start-maximized"],
  //chromiumProfile: resolve(".wxt/chrome-data2"),
  keepProfileChanges: true,
});
