let browser = window.browser || window.chrome;

window.addEventListener("DOMContentLoaded", () => {
  let startVemos = document.getElementById("start-vemos");

  startVemos.onclick = () => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      browser.tabs.sendMessage(tabs[0].id, { startVemos: true }, (response) => {
        console.log("Vemos Started Result:", response);
        window.close();
      });
    });
  };
});
