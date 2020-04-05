/* global chrome */

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "netflix.com" },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "youtube.com" },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "hulu.com" },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "disneyplus.com" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});
