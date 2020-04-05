/* global netflix */
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
