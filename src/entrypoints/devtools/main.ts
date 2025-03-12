(window as any).inspectedTabId = chrome.devtools.inspectedWindow.tabId;

chrome.devtools.panels.create("WebHID", "icon/128.png", "devtools-panel.html");
