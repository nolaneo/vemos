let browser = window.browser || window.chrome;

browser.contentScripts.register({
  js: [{ file: "url.js" }],
  runAt: "document_start",
  matches: ["http://*/", "https://*/"],
});

browser.contentScripts.register({
  js: [{ file: "assets/app.js" }, { file: "content.js" }],
  css: [{ file: "assets/app.css" }],
  runAt: "document_end",
  matches: ["http://*/", "https://*/"],
});

function contentScriptLoader() {
  browser.declarativeContent.onPageChanged.removeRules(undefined, function () {
    browser.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new browser.declarativeContent.PageStateMatcher({
            pageUrl: { schemes: ["http", "https"] },
          }),
        ],
        actions: [
          new browser.declarativeContent.RequestContentScript({
            js: ["url.js", "content.js"],
          }),
        ],
      },
    ]);
  });
}

browser.runtime.onInstalled.addListener(function () {
  console.log("On Install");
  contentScriptLoader();
});

browser.permissions.onAdded.addListener(function () {
  console.log("On Added");
  contentScriptLoader();
});

browser.runtime.onMessage.addListener(function (request, _, sendResponse) {
  if (request.permissionURL) {
    if (request.request) {
      browser.permissions.request(
        {
          origins: [request.permissionURL],
        },
        (result) => {
          sendResponse({ result: Boolean(result) });
        }
      );
    } else {
      browser.permissions.contains(
        {
          origins: [request.permissionURL],
        },
        (result) => {
          sendResponse({ result: Boolean(result) });
        }
      );
    }
  }
  return true;
});

browser.runtime.onMessage.addListener(function (request, _, sendResponse) {
  if (request.setPeerId) {
    console.log(
      "Backgound peer id set to ",
      request.setPeerId,
      " for host ",
      request.host
    );
    window.vemosPeer = {
      id: request.setPeerId,
      host: request.host,
      timeSet: new Date().getTime(),
    };
    sendResponse(true);
  }
  return true;
});

browser.runtime.onMessage.addListener(function (request, _, sendResponse) {
  if (request.getPeerId) {
    if (window.vemosPeer && window.vemosPeer.host === request.host) {
      console.log("Backgound peer id is currently ", window.VEMOS_PEER_ID);
      let timeSet = window.vemosPeer.timeSet || 0;

      let oneMinuteInMS = 60 * 1000;
      if (Math.abs(new Date().getTime() - timeSet) > oneMinuteInMS / 2) {
        console.log("Vemos peer id has expired");
        sendResponse(undefined);
      } else {
        sendResponse(window.vemosPeer.id);
      }
    } else {
      sendResponse(undefined);
    }
  }
  return true;
});
