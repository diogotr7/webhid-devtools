export async function injectInterceptor(tabId: number): Promise<boolean> {
  const tab = await chrome.tabs.get(tabId);

  if (!tab?.url || !tab.url.startsWith("http")) {
    return false;
  }

  // Execute script in main world to access WebHID API
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: injectMonitor,
  });

  return result[0].result === undefined ? false : result[0].result;
}

function injectMonitor(): boolean {
  function sendToContentScript(eventType: string, data: any) {
    try {
      window.postMessage(
        {
          source: "webhid-monitor",
          eventType,
          data,
          timestamp: Date.now(),
        },
        "*"
      );
    } catch (error) {
      console.error("[WebHID Injector] Error sending message:", error);
    }
  }

  console.debug("[WebHID Injector] Injecting WebHID interceptor");

  // Skip if WebHID API is not available
  if (!navigator.hid) {
    console.debug("[WebHID Injector] WebHID API not available");
    return false;
  }

  // Skip if already intercepted
  if ((navigator.hid as any)._intercepted) {
    console.debug("[WebHID Injector] WebHID API already intercepted");
    return false;
  }

  try {
    // Store original methods
    const original = {
      requestDevice: navigator.hid.requestDevice,
      getDevices: navigator.hid.getDevices,
      open: HIDDevice.prototype.open,
      close: HIDDevice.prototype.close,
      sendReport: HIDDevice.prototype.sendReport,
      sendFeatureReport: HIDDevice.prototype.sendFeatureReport,
      receiveFeatureReport: HIDDevice.prototype.receiveFeatureReport,
    };

    // Intercept getDevices to monitor input reports
    navigator.hid.getDevices = async function () {
      const devices = await original.getDevices.apply(this);

      return devices.map((device) => {
        // Skip if already wrapped
        if ((device as any)._inputReportHandler) return device;

        // Create handler for input reports
        (device as any)._inputReportHandler = function (
          event: HIDInputReportEvent
        ) {
          const reportData =
            event.data instanceof DataView
              ? new Uint8Array(
                  event.data.buffer,
                  event.data.byteOffset,
                  event.data.byteLength
                )
              : new Uint8Array(event.data);

          sendToContentScript("incoming:report", {
            reportId: event.reportId,
            data: Array.from(reportData),
            device: {
              productId: device.productId,
              vendorId: device.vendorId,
              productName: device.productName,
            },
          });
        };

        // Add the handler
        device.addEventListener(
          "inputreport",
          (device as any)._inputReportHandler
        );
        return device;
      });
    };

    // Intercept requestDevice
    navigator.hid.requestDevice = async function (...args) {
      sendToContentScript("requestDevice", { args });
      const devices = await original.requestDevice.apply(this, args);

      sendToContentScript("requestDevice:result", {
        devices: devices.map((d) => ({
          productId: d.productId,
          vendorId: d.vendorId,
          productName: d.productName,
        })),
      });

      return devices;
    };

    // Monitor device connections
    navigator.hid.addEventListener("connect", (e) => {
      sendToContentScript("device:connect", {
        productId: e.device.productId,
        vendorId: e.device.vendorId,
        productName: e.device.productName,
      });
    });

    // Monitor device disconnections
    navigator.hid.addEventListener("disconnect", (e) => {
      sendToContentScript("device:disconnect", {
        productId: e.device.productId,
        vendorId: e.device.vendorId,
        productName: e.device.productName,
      });
    });

    // Intercept device methods
    HIDDevice.prototype.open = async function () {
      sendToContentScript("device:open", {
        productId: this.productId,
        vendorId: this.vendorId,
        productName: this.productName,
      });
      return await original.open.apply(this);
    };

    HIDDevice.prototype.close = async function () {
      sendToContentScript("device:close", {
        productId: this.productId,
        vendorId: this.vendorId,
        productName: this.productName,
      });
      return await original.close.apply(this);
    };

    // Intercept report methods
    HIDDevice.prototype.sendReport = async function (reportId, data) {
      const buffer =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

      sendToContentScript("outgoing:report", {
        reportId,
        data: Array.from(buffer),
        device: {
          productId: this.productId,
          vendorId: this.vendorId,
          productName: this.productName,
        },
      });

      return await original.sendReport.apply(this, [reportId, data]);
    };

    HIDDevice.prototype.sendFeatureReport = async function (reportId, data) {
      const buffer =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

      sendToContentScript("outgoing:featureReport", {
        reportId,
        data: Array.from(buffer),
        device: {
          productId: this.productId,
          vendorId: this.vendorId,
          productName: this.productName,
        },
      });

      return await original.sendFeatureReport.apply(this, [reportId, data]);
    };

    HIDDevice.prototype.receiveFeatureReport = async function (reportId) {
      sendToContentScript("request:featureReport", {
        reportId,
        device: {
          productId: this.productId,
          vendorId: this.vendorId,
          productName: this.productName,
        },
      });

      const result = await original.receiveFeatureReport.apply(this, [
        reportId,
      ]);
      const resultData = new Uint8Array(result.buffer);

      sendToContentScript("incoming:featureReport", {
        reportId,
        data: Array.from(resultData),
        device: {
          productId: this.productId,
          vendorId: this.vendorId,
          productName: this.productName,
        },
      });

      return result;
    };

    // Mark as intercepted
    (navigator.hid as any)._intercepted = true;

    console.log(
      "[WebHID Injector] WebHID API methods successfully intercepted"
    );

    return true;
  } catch (error) {
    console.error(`[WebHID Background] Injection error:`, error);

    return false;
  }
}
