if (window.VEMOS_URL_SET) {
  console.log("VEMOS URL ALREADY INITIALIZED");
} else if (window.location.host !== "vemos.org") {
  let queryParamString = window.location.search;
  let queryParams = new URLSearchParams(queryParamString);

  if (queryParams.get("vemos-id")) {
    console.log("Setting vemos peer id");
    window.VEMOS_PEER_ID = queryParams.get("vemos-id");
  } else {
    console.log("No peer id");
  }
  window.VEMOS_URL_SET = true;
} else {
  console.log("Not removing Vemos Peer ID");
}
