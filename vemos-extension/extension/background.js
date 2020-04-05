let browser = window.browser || window.chrome;

browser.runtime.onInstalled.addListener(function () {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function () {
    browser.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new browser.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "netflix.com" },
          }),
          new browser.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "youtube.com" },
          }),
          new browser.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "hulu.com" },
          }),
          new browser.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "disneyplus.com" },
          }),
          new browser.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "primevideo.com" },
          }),
        ],
        actions: [new browser.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});
