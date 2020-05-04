import VideoHandler from "./video-handler";
import { timeout } from "ember-concurrency";

export default class TwitchHandler extends VideoHandler {
  noInitialPause = true;
  lastPlayEvent = 0;

  async play() {
    this.lastPlayEvent = new Date().getTime();
    if (this.videoElement.paused) {
      return await this.withDisabledEventPropagation(["play"], async () => {
        console.log("play");
        await this.performPlay();
      });
    } else {
      console.log("Ignoring play – already playing");
    }
  }

  onPause() {
    this.setPlayerState();
    let time = new Date().getTime();
    if (time - this.lastPlayEvent > 2000) {
      console.log(event);
      super.onPause(event);
    } else {
      console.log("Pause event loop. Skipping");
    }
  }
}
