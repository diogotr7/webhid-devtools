export default defineContentScript({
  matches: ["*://*/*"],
  world: "ISOLATED",
  main() {
    console.debug("[WebHidContent] Content script loaded");

    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      const message = event.data;
      if (!message || message.source !== "webhid-monitor") return;

      // Forward to background
      chrome.runtime.sendMessage(message).catch((error) => {
        console.error("[WebHidContent] Error sending message:", error);
      });
    });
  },
});
