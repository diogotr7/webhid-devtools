import { defineRunnerConfig } from "wxt";
import { resolve } from "node:path";

export default defineRunnerConfig({
  startUrls: ["https://wootility.io"],
  chromiumArgs: ["--auto-open-devtools-for-tabs", "--start-maximized"],
  chromiumProfile: resolve(".wxt/chrome-data"),
  keepProfileChanges: true,
});
