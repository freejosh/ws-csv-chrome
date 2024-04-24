/* global chrome */
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['content-style.css'],
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [process.env.MAIN_FILE],
  });
});
