let browser = window.browser || window.chrome;

browser.contentScripts.register({
  js: [{ file: 'url.js' }],
  runAt: 'document_start',
  matches: ["http://*/", "https://*/"],
});

browser.contentScripts.register({
  js: [{ file: 'assets/app.js' }, { file: 'content.js' }],
  css: [{ file: 'assets/app.css' }],
  runAt: 'document_end',
  matches: ["http://*/", "https://*/"],
});

function contentScriptLoader() {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function () {
    browser.declarativeContent.onPageChanged.addRules([
      {
        conditions: [new browser.declarativeContent.PageStateMatcher({ pageUrl: { schemes: ['http', 'https'] } })],
        actions: [new browser.declarativeContent.RequestContentScript({
          js: ['url.js', 'content.js']
        })],
      }
    ]);
  });
}

browser.runtime.onInstalled.addListener(function () {
  console.log('On Install');
  contentScriptLoader();
});

browser.permissions.onAdded.addListener(function() {
  console.log('On Added');
  contentScriptLoader();
});

browser.runtime.onMessage.addListener(function(request, _, sendResponse) {
  if (request.permissionURL) {
    if (request.request) {
      browser.permissions.request({
        origins: [request.permissionURL]
      }, result => {
        sendResponse({ result: Boolean(result) });
      });
    } else {
      browser.permissions.contains({
        origins: [request.permissionURL]
      }, result => {
        sendResponse({ result: Boolean(result) });
      });
    }

  }
  return true;
});