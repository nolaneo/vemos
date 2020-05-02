/* global require */

function parseExtensionVersion(extensionVersionString) {
  let [major, minor, patch] = extensionVersionString.split(".");
  let extensionVersionNumber =
    Number(major) * 1000 + Number(minor) * 100 + Number(patch);
  console.log("Extension version number", extensionVersionNumber);
  return extensionVersionNumber;
}

if (window.VEMOS_CONTENT_SET) {
  console.log("VEMOS CONTENT ALREADY INITIALIZED");
} else {
  const EXTENSION_ID = "vemos-container";
  const IFRAME_ID = "vemos-frame";

  class ContentScript {
    get browser() {
      return window.browser || window.chrome;
    }

    injectVemos(peerId = null) {
      console.log("injectVemos", peerId);
      if (document.body && document.contentType !== "application/pdf") {
        this.injectExtensionFrame();
        this.injectEmberApp(peerId);

        let script = document.createElement("script");
        script.type = "text/javascript";
        script.id = "vemos-netflix-reference";
        script.innerHTML = `
          console.log('Vemos - Adding Netflix API Listener');
          window.addEventListener("message", (event) => {
            if (event.data.vemosSeekTime) {
              console.log("VEMOS Neflix API seek", event.data.vemosSeekTime);
              let videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
              let player = videoPlayer.getVideoPlayerBySessionId(
                videoPlayer.getAllPlayerSessionIds()[0]
              );
              player.seek(Math.round(Number(event.data.vemosSeekTime)) * 1000);
            }
          });
        `;
        document.head.appendChild(script);
      }
    }

    injectExtensionFrame() {
      let vemosExtension = document.createElement("div");
      vemosExtension.id = EXTENSION_ID;
      let iframe = document.createElement("iframe");
      iframe.id = IFRAME_ID;
      iframe.frameBorder = 0;
      iframe.allow = "autoplay";
      vemosExtension.appendChild(iframe);
      document.body.insertAdjacentElement("afterEnd", vemosExtension);
      iframe.contentDocument;
    }

    injectEmberApp(peerId) {
      const iframe = window.document.getElementById(IFRAME_ID);
      this.injectFrameTemplate(iframe, peerId);
    }

    injectFrameTemplate(iframe, peerId) {
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

      let script = document.createElement("script");
      script.type = "text/javascript";
      script.charset = "utf-8";
      script.src = this.browser.runtime.getURL("assets/app.js");

      let styles = document.createElement("link");
      styles.type = "text/css";
      styles.rel = "stylesheet";
      styles.charset = "utf-8";
      styles.id = "vemos-styles";
      styles.href = this.browser.runtime.getURL("assets/app.css");

      iframe.contentWindow.document.head.appendChild(script);
      iframe.contentWindow.document.head.appendChild(styles);

      if (peerId) {
        let meta = document.createElement("meta");
        meta.id = "vemos-peer-id";
        meta.name = "VEMOS_PEER_ID";
        meta.content = peerId;
        iframe.contentWindow.document.head.appendChild(meta);
      }

      let meta = document.createElement("meta");
      meta.id = "vemos-version-number";
      meta.name = "VEMOS_VERSION";
      meta.content = browser.runtime.getManifest().version;
      iframe.contentWindow.document.head.appendChild(meta);

      iframe.contentWindow.VEMOS_NETFLIX_PLAYER = window.VEMOS_NETFLIX_PLAYER;
    }
  }

  window.VEMOS_CONTENT_SET = true;

  let browser = window.browser || window.chrome;

  let versionNumber = parseExtensionVersion(
    browser.runtime.getManifest().version
  );

  if (versionNumber > 5) {
    browser.runtime.sendMessage(
      { getPeerId: true, host: window.location.host },
      (peerId) => {
        console.log("Peer Id Set? ", Boolean(peerId));
        if (peerId) {
          setTimeout(() => {
            let contentScript = new ContentScript();
            contentScript.injectVemos(peerId);
          }, 1000);
        }
      }
    );
  } else if (window.VEMOS_PEER_ID) {
    setTimeout(() => {
      console.log("A Peer ID was present, booting Vemos");
      let url = new URL(window.location.href);
      url.searchParams.delete("vemos-id");
      window.history.replaceState(
        window.history.state,
        window.document.title,
        url.toString()
      );
      let contentScript = new ContentScript();
      contentScript.injectVemos();
    }, 250);
  }

  if (browser.runtime) {
    console.log("Adding Vemos message listener");
    browser.runtime.onMessage.addListener(async function (
      request,
      _,
      sendResponse
    ) {
      if (request.startVemos) {
        console.log("Message received. Starting Vemos!");
        let contentScript = new ContentScript();
        contentScript.injectVemos();
        sendResponse(true);
      }
    });
  }
}
