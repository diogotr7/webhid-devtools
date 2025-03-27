export default defineBackground(() => {
  const activeDevtoolsTabs = new Set<number>();
  console.log("[Background] Background script loaded");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.debug("[Background] Received message", message);
    if (!message || typeof message !== "object") return false;

    switch (message.source) {
      case "webhid-monitor": {
        // Forward to DevTools if it's registered for this tab
        const tabId = sender.tab?.id;
        if (tabId && activeDevtoolsTabs.has(tabId)) {
          // Forward to DevTools panel for this tab
          chrome.runtime
            .sendMessage({
              source: "background-relay",
              originalSource: "webhid-monitor",
              data: message,
              tabId: tabId,
            })
            .catch(() => {
              // DevTools might be closed, remove from active tabs
              activeDevtoolsTabs.delete(tabId);
            });
        }

        sendResponse({ success: true });
        return true;
      }
      case "webhid-devtools": {
        const { action, tabId } = message;

        if (action === "register-devtools" && tabId) {
          console.log("[Background] Registering DevTools", tabId);
          activeDevtoolsTabs.add(tabId);

          browser.scripting
            .executeScript({
              target: { tabId },
              world: "MAIN",
              files: ["/content-scripts/inject.js"],
            })
            .then((success) => {
              console.log("[Background] Injection status", success, tabId);
            })
            .catch((error) => {
              console.error("[Background] Injection error", error);
            });
        } else if (action === "unregister-devtools" && tabId) {
          console.log("[Background] Unregistering DevTools", tabId);
          activeDevtoolsTabs.delete(tabId);
          sendResponse({ success: true });
        }

        return true;
      }
      default: {
        return false;
      }
    }
  });

  // Re-inject monitor when tab is updated if DevTools is registered
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    console.log("[Background] Tab updated", tabId, changeInfo);
    if (changeInfo.status === "complete" && activeDevtoolsTabs.has(tabId)) {
      browser.scripting
        .executeScript({
          target: { tabId },
          world: "MAIN",
          files: ["/content-scripts/inject.js"],
        })
        .then((success) => {
          console.log("[Background] Injection status", success, tabId);
        })
        .catch((error) => {
          console.error("[Background] Injection error", error);
        });
    }
  });

  // Remove tab from active tabs when closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    console.log("[Background] Tab removed", tabId);
    activeDevtoolsTabs.delete(tabId);
  });
});
