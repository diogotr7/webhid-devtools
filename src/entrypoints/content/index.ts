export default defineContentScript({
  matches: ["*://*/*"],
  world: "ISOLATED",
  async main() {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      const message = event.data;
      if (!message || message.source !== "webhid-monitor") return;

      // Forward to background
      chrome.runtime.sendMessage(message).catch((error) => {
        console.error("[WebHID Monitor] Error sending message:", error);
      });
    });
  },
});
