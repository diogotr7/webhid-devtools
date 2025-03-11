import { injectInterceptor } from "./injectWebHid";

export default defineBackground(() => {
  const activeDevtoolsTabs = new Set<number>();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
          activeDevtoolsTabs.add(tabId);

          // Initial injection
          injectInterceptor(tabId).then((success) => {
            chrome.tabs.sendMessage(tabId, {
              source: "background",
              eventType: "injection-status",
              data: { success, tabId },
              timestamp: Date.now(),
            });
          });

          sendResponse({ success: true });
        } else if (action === "unregister-devtools" && tabId) {
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
    if (changeInfo.status === "complete" && activeDevtoolsTabs.has(tabId)) {
      injectInterceptor(tabId);
    }
  });

  // Remove tab from active tabs when closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    activeDevtoolsTabs.delete(tabId);
  });
});
