export default defineContentScript({
  matches: ["*://*/*"],
  world: "ISOLATED",
  main() {
    console.log("[Content] Loading");

    window.addEventListener("message", (event) => {
      console.log("[Content] Received evt:", event);

      if (event.source !== window) return;

      const message = event.data;
      if (!message || message.source !== "webhid-monitor") return;

      console.log("[Content] Received message:", message);

      // Forward to background
      chrome.runtime.sendMessage(message).catch((error) => {
        console.error("[Content] Error sending message:", error);
      });
    });
  },
});
