let browser = window.browser || window.chrome;


const KNOWN_HOSTS = [
  "netflix.com",
  "youtube.com",
  "disneyplus.com",
  "hulu.com",
  "primevideo.com",
  "primevideo.co.uk",
  "amazon.com",
  "amazon.co.uk",
  "plex.tv",
];

browser.runtime.onInstalled.addListener(function () {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function () {
    browser.declarativeContent.onPageChanged.addRules([
      {
        conditions: KNOWN_HOSTS.map(hostSuffix => new browser.declarativeContent.PageStateMatcher({ pageUrl: { hostSuffix } })),
        actions: [new browser.declarativeContent.ShowPageAction()],
      }
    ]);
  });
});
