import { useState, useEffect, useCallback } from "react";

type WebHIDPacket = {
  eventType: string;
  data: any;
  timestamp: number;
};

export function useWebHidMonitor() {
  const [packets, setPackets] = useState<WebHIDPacket[]>([]);
  const [tabId, setTabId] = useState<number | null>(null);

  const MAX_PACKETS = 1000;

  // Clear packets
  const clearPackets = useCallback(() => {
    setPackets([]);
  }, []);

  // Initialize with tab ID and register with background
  useEffect(() => {
    console.debug(`[WebHID Monitor] DevTools panel initializing`);
    const inspectedTabId = (window as any).inspectedTabId;

    if (inspectedTabId) {
      setTabId(inspectedTabId);

      // Register with background script
      chrome.runtime
        .sendMessage({
          source: "webhid-devtools",
          action: "register-devtools",
          tabId: inspectedTabId,
        })
        .then(() => {
          console.debug(
            `[WebHID Monitor] Registered with background for tab ${inspectedTabId}`
          );
        })
        .catch((error) => {
          console.debug(`[WebHID Monitor] Registration error: ${error}`);
        });
    }

    // Setup cleanup
    return () => {
      if (inspectedTabId) {
        chrome.runtime.sendMessage({
          source: "webhid-devtools",
          action: "unregister-devtools",
          tabId: inspectedTabId,
        });
      }
    };
  }, []);

  // Listen for WebHID messages from background
  useEffect(() => {
    if (!tabId) return;

    const messageListener = (message: any) => {
      // Handle relayed WebHID messages
      if (
        message.source === "background-relay" &&
        message.originalSource === "webhid-monitor" &&
        message.tabId === tabId
      ) {
        const webhidData = message.data;
        console.debug(
          `[WebHID Monitor] Received WebHID event: ${webhidData.eventType}`
        );

        // Add new packet to the list (limited to MAX_PACKETS)
        setPackets((prev) =>
          [
            {
              eventType: webhidData.eventType,
              data: webhidData.data,
              timestamp: webhidData.timestamp,
            },
            ...prev,
          ].slice(0, MAX_PACKETS)
        );
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [tabId]);

  return {
    packets,
    tabId,
    clearPackets,
  };
}
