let queryParamString = window.location.search;
let queryParams = new URLSearchParams(queryParamString);

if (queryParams.get("vemos-id")) {
  window.VEMOS_PEER_ID = queryParams.get("vemos-id");
  let url = new URL(window.location.href);
  url.searchParams.delete("vemos-id");
  window.history.replaceState(
    window.history.state,
    window.document.title,
    url.toString()
  );
} else {
  console.log("No peer id");
}
