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

browser.runtime.onMessage.addListener(async (request, _, sendResponse) => {
  if (request.registerContentScriptsOnUrl) {
    await browser.contentScripts.register({
      js: [{ file: 'url.js' }],
      runAt: 'document_start',
      matches: [request.registerContentScriptsOnUrl]
    });
    await browser.contentScripts.register({
      js: [{ file: 'assets/app.js' }, { file: 'content.js' }],
      css: [{ file: 'assets/app.css' }],
      runAt: 'document_end',
      matches: [request.registerContentScriptsOnUrl]
    });
    console.log("Content scripts registered", request.registerContentScriptsOnUrl);
    sendResponse(true);
  }
});

function contentScriptLoader() {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function () {
    browser.permissions.getAll(result => {
      console.log(result.origins)      // [ "*://*.mozilla.org/*" ]
      browser.declarativeContent.onPageChanged.addRules([
        {
          conditions: [new browser.declarativeContent.PageStateMatcher({ pageUrl: { schemes: ['http', 'https'] } })],
          actions: [new browser.declarativeContent.RequestContentScript({
            js: ['url.js', 'assets/app.js', 'content.js']
          })],
        }
      ]);
    });
  });
}

browser.runtime.onInstalled.addListener(function () {
  console.log('On Install');
  contentScriptLoader();
});

browser.permissions.onAdded.addListener(function() {
  console.log('On Added');
  contentScriptLoader();
})
