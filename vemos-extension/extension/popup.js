let browser = window.browser || window.chrome;

async function executeScripts() {
  if (!window.EXECUTED_SCRIPTS) {
    await browser.tabs.executeScript({ file: 'url.js' });
    await browser.tabs.executeScript({ file: 'assets/app.js' });
    await browser.tabs.executeScript({ file: 'content.js' });
    window.EXECUTED_SCRIPTS = true;
  }
}

async function openVemos(tabs) {
  console.log('Open Vemos');
  executeScripts();
  browser.tabs.sendMessage(tabs[0].id, { startVemos: true }, (response) => {
    console.log("Vemos Started Result:", response);
    window.close();
  });
}

  
async function registerScripts(permissionURL) {
  console.log('Register Vemos scripts');
  await browser.contentScripts.register({
    js: [{ file: 'url.js' }],
    runAt: 'document_start',
    matches: [permissionURL]
  });
  await browser.contentScripts.register({
    js: [{ file: 'assets/app.js' }, { file: 'content.js' }],
    css: [{ file: 'assets/app.css' }],
    runAt: 'document_end',
    matches: [permissionURL]
  });

}

function requestPermissions(permissionURL) {
  browser.permissions.request({
    origins: [permissionURL]
  }, async (granted) => {
      if (granted) {
        console.log('Permission given');
        await registerScripts(permissionURL);
        console.log("Content scripts registered", permissionURL);
        let startVemos = document.getElementById("start-vemos");
        let getPermissions = document.getElementById("get-permissions");
        startVemos.style.display = 'block';
        getPermissions.style.display = 'none';
        executeScripts();
      } else {
        console.log('Permission refused');
      }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  let startVemos = document.getElementById("start-vemos");
  let getPermissions = document.getElementById("get-permissions");

  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('URL',tabs[0].url);
    let url = new URL(tabs[0].url);
    let permissionURL = `*://${url.host}/*`;

    browser.permissions.contains({
      origins: [permissionURL]
    }, (hasPermission) => {
      if (hasPermission) {
        executeScripts();
        getPermissions.style.display = 'none';
      } else {
        getPermissions.innerText = `Allow Vemos to run on ${url.host}`;
        startVemos.style.display = 'none';
      }
    });
  });


  startVemos.onclick = () => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      openVemos(tabs);
    });
  };

  getPermissions.onclick = async () => {
    browser.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      console.log('URL',tabs[0].url);
      let url = new URL(tabs[0].url);
      let permissionURL = `*://${url.host}/*`;
      await requestPermissions(permissionURL);
    });
  };
});
