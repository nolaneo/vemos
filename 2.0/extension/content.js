const EXTENSION_ID = "vemos-container";
const IFRAME_ID = "vemos-frame";

class ContentScript {
  get browser() {
    return window.browser || window.chrome;
  }

  injectVemos() {
    if (document.body && document.contentType !== "application/pdf") {
      this.injectExtensionFrame();
      this.injectEmberApp();
    }
  }

  injectExtensionFrame() {
    let vemosExtension = document.createElement("div");
    vemosExtension.id = EXTENSION_ID;
    let iframe = document.createElement("iframe");
    iframe.id = IFRAME_ID;
    iframe.frameBorder = 0;
    vemosExtension.appendChild(iframe);
    document.body.insertAdjacentElement("afterEnd", vemosExtension);
    iframe.contentDocument;
  }

  injectEmberApp() {
    const iframe = window.document.getElementById(IFRAME_ID);
    this.injectFrameTemplate(iframe);
    this.injectVemosScripts(iframe);
  }

  injectFrameTemplate(iframe) {
    iframe.contentDocument.open();
    iframe.contentDocument.write(`
    <!doctype html>
      <head>
        <title>Vemos</title>
      </head>
      <body></body>
    </html>
    `);
    iframe.contentDocument.close();
  }

  injectVemosScripts(frame) {
    const jsTag = this.createScriptTag(
      this.browser.runtime.getURL("assets/app.js")
    );
    const stylesLink = this.createLinkTag(
      this.browser.runtime.getURL("assets/app.css")
    );
    frame.contentWindow.document.head.appendChild(jsTag);
    frame.contentWindow.document.head.appendChild(stylesLink);
  }

  createScriptTag(url) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.src = url;
    return script;
  }

  createLinkTag(url) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.src = url;
    return link;
  }
}

let contentScript = new ContentScript();

contentScript.injectVemos();
