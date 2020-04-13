/* global require */

if (window.VEMOS_CONTENT_SET)  {
  console.log('VEMOS CONTENT ALREADY INITIALIZED');
} else {
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
        // let iframe = document.getElementById(IFRAME_ID);
        // require("vemos-plugin/app")["default"].create({
        //   rootElement: iframe.contentDocument.body,
        // });

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

      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.src = this.browser.runtime.getURL("assets/app.js");


      let styles = document.createElement('link');
      styles.type = 'text/css';
      styles.rel = "stylesheet";
      styles.charset = 'utf-8';
      styles.href = this.browser.runtime.getURL("assets/app.css");

      iframe.contentWindow.document.head.appendChild(script);
      iframe.contentWindow.document.head.appendChild(styles);

      if (window.VEMOS_PEER_ID) {
        let meta = document.createElement('meta');
        meta.id = 'vemos-peer-id';
        meta.name ="VEMOS_PEER_ID";
        meta.content = window.VEMOS_PEER_ID;
        iframe.contentWindow.document.head.appendChild(meta);

      }

      iframe.contentWindow.VEMOS_NETFLIX_PLAYER = window.VEMOS_NETFLIX_PLAYER;
    }
  }

  window.VEMOS_CONTENT_SET = true;

  if (window.VEMOS_PEER_ID) {
    setTimeout(() =>{
      console.log("A Peer ID was present, booting Vemos");
      let contentScript = new ContentScript();
      contentScript.injectVemos();
    }, 100);
  }

  let browser = window.browser || window.chrome;

  if (browser.runtime) {
    console.log("Adding Vemos message listener");
    browser.runtime.onMessage.addListener(async function (request, _, sendResponse) {
      if (request.startVemos) {
        console.log("Message received. Starting Vemos!");
        let contentScript = new ContentScript();
        contentScript.injectVemos();
        sendResponse(true);
      }
    });  
  }
}
