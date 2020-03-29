/* global require */

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
      let iframe = document.getElementById(IFRAME_ID);
      require("vemos-plugin/app")["default"].create({
        rootElement: iframe.contentDocument.body
      });
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
  }

  injectFrameTemplate(iframe) {
    iframe.contentDocument.open();
    iframe.contentDocument.write(`
      <html id="vemos-html">
        <head>
          <title>Vemos</title>
        </head>
        <body id="vemos-body"></body>
      </html>
    `);
    iframe.contentDocument.close();
  }
}

let contentScript = new ContentScript();

contentScript.injectVemos();
