let browser = window.browser || window.chrome;

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