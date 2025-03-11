chrome.devtools.panels.create(
  "WebHID",
  "icon/128.png",
  "devtools-panel.html",
  (panel) => {
    panel.onShown.addListener((window) => {
      // Store the tabId in the window for the panel to use
      (window as any).inspectedTabId = chrome.devtools.inspectedWindow.tabId;
    });
  }
);
