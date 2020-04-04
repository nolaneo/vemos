let queryParamString = window.location.search;
let queryParams = new URLSearchParams(queryParamString);

if (queryParams.get("vemos-id")) {
  window.VEMOS_PEER_ID = queryParams.get("vemos-id");
} else {
  console.log("No peer id");
}
